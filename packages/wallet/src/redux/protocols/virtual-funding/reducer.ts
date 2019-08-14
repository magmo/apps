import * as states from './states';
import { SharedData, getPrivatekey, setFundingState } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer, makeLocator } from '..';
import { WalletAction, advanceChannel } from '../../actions';
import { VirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { CommitmentType } from '../../../domain';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator/lib/consensus-app';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../constants';
import { advanceChannelReducer } from '../advance-channel';
import * as consensusUpdate from '../consensus-update';
import * as indirectFunding from '../indirect-funding';
import { ethers } from 'ethers';
import { addHex } from '../../../utils/hex-utils';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../advance-channel/reducer';
import { routesToAdvanceChannel } from '../advance-channel/actions';
import { routesToIndirectFunding } from '../indirect-funding/actions';
import { routesToConsensusUpdate, clearedToSend } from '../consensus-update/actions';
import { EmbeddedProtocol } from '../../../communication';

export const VIRTUAL_FUNDING_PROTOCOL_LOCATOR = 'VirtualFunding';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../consensus-update/reducer';
import { TwoPartyPlayerIndex } from '../../types';

export function initialize(
  sharedData: SharedData,
  args: states.InitializationArgs,
): ProtocolStateWithSharedData<states.NonTerminalVirtualFundingState> {
  const {
    ourIndex,
    processId,
    targetChannelId,
    startingAllocation,
    startingDestination,
    hubAddress,
    protocolLocator,
  } = args;
  const privateKey = getPrivatekey(sharedData, targetChannelId);
  const channelType = CONSENSUS_LIBRARY_ADDRESS;

  const initializationArgs = {
    privateKey,
    channelType,
    ourIndex,
    commitmentType: CommitmentType.PreFundSetup,
    clearedToSend: true,
    processId,
    protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
    participants: [...startingDestination, hubAddress],
  };

  const jointAllocation = [...startingAllocation, startingAllocation.reduce(addHex)];
  const jointDestination = [...startingDestination, hubAddress];
  const jointChannelInitialized = advanceChannel.initializeAdvanceChannel(sharedData, {
    ...initializationArgs,
    ...channelSpecificArgs(jointAllocation, jointDestination),
  });

  return {
    protocolState: states.waitForJointChannel({
      processId,
      jointChannel: jointChannelInitialized.protocolState,
      targetChannelId,
      startingAllocation,
      startingDestination,
      ourIndex,
      hubAddress,
      protocolLocator,
    }),
    sharedData: jointChannelInitialized.sharedData,
  };
}

export const reducer: ProtocolReducer<states.VirtualFundingState> = (
  protocolState: states.NonTerminalVirtualFundingState,
  sharedData: SharedData,
  action: VirtualFundingAction,
) => {
  switch (protocolState.type) {
    case 'VirtualFunding.WaitForJointChannel': {
      return waitForJointChannelReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForGuarantorChannel': {
      return waitForGuarantorChannelReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForGuarantorFunding': {
      return waitForGuarantorFundingReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForApplicationFunding': {
      return waitForApplicationFundingReducer(protocolState, sharedData, action);
    }
    default:
      return unreachable(protocolState);
  }
};

function waitForJointChannelReducer(
  protocolState: states.WaitForJointChannel,
  sharedData: SharedData,
  action: WalletAction,
) {
  const { processId, hubAddress, ourIndex, protocolLocator } = protocolState;
  if (routesToAdvanceChannel(action, protocolState.protocolLocator)) {
    const result = advanceChannelReducer(protocolState.jointChannel, sharedData, action);

    if (advanceChannel.isSuccess(result.protocolState)) {
      const { channelId: jointChannelId } = result.protocolState;
      switch (result.protocolState.commitmentType) {
        case CommitmentType.PreFundSetup:
          const jointChannelResult = advanceChannel.initializeAdvanceChannel(result.sharedData, {
            clearedToSend: true,
            commitmentType: CommitmentType.PostFundSetup,
            processId,
            protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
            channelId: jointChannelId,
            ourIndex,
          });

          return {
            protocolState: {
              ...protocolState,
              jointChannel: jointChannelResult.protocolState,
            },
            sharedData: jointChannelResult.sharedData,
          };
        case CommitmentType.PostFundSetup:
          const { targetChannelId } = protocolState;
          const privateKey = getPrivatekey(sharedData, targetChannelId);
          const ourAddress = new ethers.Wallet(privateKey).address;
          const channelType = CONSENSUS_LIBRARY_ADDRESS;
          const destination = [targetChannelId, ourAddress, hubAddress];
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            result.sharedData,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PreFundSetup,
              processId,
              protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
              ourIndex: TwoPartyPlayerIndex.A, // When creating the guarantor channel with the hub we are always the first player
              privateKey,
              channelType,
              participants: [ourAddress, hubAddress],
              guaranteedChannel: jointChannelId,
              ...channelSpecificArgs([], destination),
            },
          );
          return {
            protocolState: states.waitForGuarantorChannel({
              ...protocolState,
              guarantorChannel: guarantorChannelResult.protocolState,
              jointChannelId,
            }),
            sharedData: guarantorChannelResult.sharedData,
          };
        default:
          return {
            protocolState: states.waitForJointChannel({
              ...protocolState,
              jointChannel: result.protocolState,
            }),
            sharedData: result.sharedData,
          };
      }
    } else {
      return {
        protocolState: states.waitForJointChannel({
          ...protocolState,
          jointChannel: result.protocolState,
        }),
        sharedData: result.sharedData,
      };
    }
  }
  return { protocolState, sharedData };
}

function waitForGuarantorChannelReducer(
  protocolState: states.WaitForGuarantorChannel,
  sharedData: SharedData,
  action: WalletAction,
) {
  const { processId, ourIndex, protocolLocator } = protocolState;
  if (routesToAdvanceChannel(action, protocolState.protocolLocator)) {
    const result = advanceChannelReducer(protocolState.guarantorChannel, sharedData, action);
    if (advanceChannel.isSuccess(result.protocolState)) {
      const { channelId: guarantorChannelId } = result.protocolState;
      const fundingState = {
        guarantorChannel: guarantorChannelId,
        directlyFunded: false,
      };
      result.sharedData = setFundingState(
        result.sharedData,
        protocolState.jointChannelId,
        fundingState,
      );
      switch (result.protocolState.commitmentType) {
        case CommitmentType.PreFundSetup:
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            result.sharedData,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PostFundSetup,
              processId,
              protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
              channelId: guarantorChannelId,
              ourIndex: TwoPartyPlayerIndex.A, // When creating the guarantor channel with the hub we are always the first player
              guaranteedChannel: protocolState.jointChannelId,
            },
          );
          return {
            protocolState: {
              ...protocolState,
              guarantorChannel: guarantorChannelResult.protocolState,
            },
            sharedData: guarantorChannelResult.sharedData,
          };

        case CommitmentType.PostFundSetup:
          const startingAllocation = [
            protocolState.startingAllocation[ourIndex],
            protocolState.startingAllocation[ourIndex],
          ];
          const startingDestination = [
            protocolState.startingDestination[ourIndex],
            protocolState.hubAddress,
          ];
          const indirectFundingResult = indirectFunding.initializeIndirectFunding({
            processId,
            channelId: result.protocolState.channelId,
            startingAllocation,
            startingDestination,
            participants: startingDestination,
            sharedData: result.sharedData,
            protocolLocator: makeLocator(
              protocolState.protocolLocator,
              EmbeddedProtocol.IndirectFunding,
            ),
          });
          switch (indirectFundingResult.protocolState.type) {
            case 'IndirectFunding.Failure':
              return {
                protocolState: states.failure({}),
                sharedData: indirectFundingResult.sharedData,
              };
            default:
              const { targetChannelId, hubAddress, jointChannelId } = protocolState;
              // We initialize our joint channel sub-protocol early in case we receive a commitment before we're done funding
              const proposedAllocation = [
                startingAllocation.reduce(addHex),
                startingAllocation.reduce(addHex),
              ];
              const proposedDestination = [targetChannelId, hubAddress];

              const applicationFundingResult = consensusUpdate.initializeConsensusUpdate({
                processId,
                channelId: jointChannelId,
                clearedToSend: false,
                proposedAllocation,
                proposedDestination,
                protocolLocator: makeLocator(
                  protocolState.protocolLocator,
                  CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
                ),
                sharedData: indirectFundingResult.sharedData,
              });
              return {
                protocolState: states.waitForGuarantorFunding({
                  ...protocolState,
                  indirectGuarantorFunding: indirectFundingResult.protocolState,
                  indirectApplicationFunding: applicationFundingResult.protocolState,
                }),
                sharedData: applicationFundingResult.sharedData,
              };
          }

        default:
          return {
            protocolState: states.waitForGuarantorChannel({
              ...protocolState,
              guarantorChannel: result.protocolState,
            }),
            sharedData: result.sharedData,
          };
      }
    } else {
      return {
        protocolState: states.waitForGuarantorChannel({
          ...protocolState,
          guarantorChannel: result.protocolState,
        }),
        sharedData: result.sharedData,
      };
    }
  }
  return { protocolState, sharedData };
}

function waitForGuarantorFundingReducer(
  protocolState: states.WaitForGuarantorFunding,
  sharedData: SharedData,
  action: WalletAction,
) {
  const { processId, protocolLocator } = protocolState;
  if (
    !routesToIndirectFunding(action, protocolLocator) &&
    !routesToConsensusUpdate(action, protocolLocator)
  ) {
    console.warn(
      `Expected indirectFunding or consensusUpdate action, received ${action.type} instead`,
    );
    return { protocolState, sharedData };
  }
  if (routesToConsensusUpdate(action, protocolLocator)) {
    let indirectApplicationFunding: consensusUpdate.ConsensusUpdateState;
    ({
      protocolState: indirectApplicationFunding,
      sharedData,
    } = consensusUpdate.consensusUpdateReducer(
      protocolState.indirectApplicationFunding,
      sharedData,
      action,
    ));
    switch (indirectApplicationFunding.type) {
      // TODO: Properly handle the success case
      // We don't expect this to ever happen now but we should future-proof it
      case 'ConsensusUpdate.Success':
      case 'ConsensusUpdate.Failure':
        return {
          protocolState: states.failure({
            reason: 'Consensus Update failed or succeeded too early',
          }),
          sharedData,
        };
      default:
        return { protocolState: { ...protocolState, indirectApplicationFunding }, sharedData };
    }
  }
  const result = indirectFunding.indirectFundingReducer(
    protocolState.indirectGuarantorFunding,
    sharedData,
    action,
  );
  if (indirectFunding.isTerminal(result.protocolState)) {
    switch (result.protocolState.type) {
      case 'IndirectFunding.Success':
        // Once funding is complete we allow consensusUpdate to send commitments
        const applicationFundingResult = consensusUpdate.consensusUpdateReducer(
          protocolState.indirectApplicationFunding,
          result.sharedData,
          clearedToSend({
            processId,
            protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
          }),
        );
        return {
          protocolState: states.waitForApplicationFunding({
            ...protocolState,
            indirectApplicationFunding: applicationFundingResult.protocolState,
          }),
          sharedData: applicationFundingResult.sharedData,
        };
      case 'IndirectFunding.Failure':
        throw new Error(`Indirect funding failed: ${result.protocolState.reason}`);

      default:
        return unreachable(result.protocolState);
    }
  } else {
    return {
      protocolState: states.waitForGuarantorFunding({
        ...protocolState,

        indirectGuarantorFunding: result.protocolState,
      }),
      sharedData: result.sharedData,
    };
  }
}

function waitForApplicationFundingReducer(
  protocolState: states.WaitForApplicationFunding,
  sharedData: SharedData,
  action: WalletAction,
) {
  if (routesToConsensusUpdate(action, protocolState.protocolLocator)) {
    const result = consensusUpdate.consensusUpdateReducer(
      protocolState.indirectApplicationFunding,
      sharedData,
      action,
    );
    if (consensusUpdate.isTerminal(result.protocolState)) {
      switch (result.protocolState.type) {
        case 'ConsensusUpdate.Success':
          return {
            protocolState: states.success(protocolState),
            sharedData: result.sharedData,
          };
        case 'ConsensusUpdate.Failure':
          throw new Error(`Indirect funding failed: ${result.protocolState.reason}`);

        default:
          return unreachable(result.protocolState);
      }
    } else {
      return {
        protocolState: states.waitForApplicationFunding({
          ...protocolState,
          indirectApplicationFunding: result.protocolState,
        }),
        sharedData: result.sharedData,
      };
    }
  }
  return { protocolState, sharedData };
}

function channelSpecificArgs(
  allocation: string[],
  destination: string[],
): { allocation: string[]; destination: string[]; appAttributes: string } {
  return {
    allocation,
    destination,
    appAttributes: bytesFromAppAttributes({
      proposedAllocation: [],
      proposedDestination: [],
      furtherVotesRequired: 0,
    }),
  };
}
