import * as states from './states';
import { SharedData, getPrivateKey, setFundingState } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer, makeLocator } from '..';
import { WalletAction, advanceChannel } from '../../actions';
import { VirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';

import { CONSENSUS_LIBRARY_ADDRESS, ETH_ASSET_HOLDER } from '../../../constants';
import { advanceChannelReducer } from '../advance-channel';
import * as consensusUpdate from '../consensus-update';
import * as ledgerFunding from '../ledger-funding';
import { addHex } from '../../../utils/hex-utils';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../advance-channel/reducer';
import { routesToAdvanceChannel } from '../advance-channel/actions';
import { routesToLedgerFunding } from '../ledger-funding/actions';
import { routesToConsensusUpdate, clearedToSend } from '../consensus-update/actions';
import { EmbeddedProtocol } from '../../../communication';

export const VIRTUAL_FUNDING_PROTOCOL_LOCATOR = 'VirtualFunding';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../consensus-update/reducer';
import { StateType } from '../advance-channel/states';
import { encodeConsensusData } from 'nitro-protocol/lib/src/contract/consensus-data';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';
import { getEthAllocation, addToEthAllocation } from '../reducer-helpers';
import { getChannelState, getLastStateForChannel } from '../../selectors';

export function initialize(
  sharedData: SharedData,
  args: states.InitializationArgs,
): ProtocolStateWithSharedData<states.NonTerminalVirtualFundingState> {
  const { processId, targetChannelId, startingOutcome, hubAddress, protocolLocator } = args;
  const privateKey = getPrivateKey(sharedData);
  const ourAddress = sharedData.address;
  const channel = getChannelState(sharedData, targetChannelId).channel;
  const { chainId } = channel;
  const appDefinition = CONSENSUS_LIBRARY_ADDRESS;
  // TODO: Set challenge duration properly
  const challengeDuration = '0x0';
  // TODO: Add token support
  const ethAllocation = getEthAllocation(startingOutcome);
  if (!ethAllocation) {
    throw new Error('No eth asset holder allocation');
  }
  const initializationArgs = {
    privateKey,
    appDefinition,
    ourAddress,
    stateType: StateType.PreFunding,
    clearedToSend: true,
    processId,

    protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
    participants: [...ethAllocation.map(o => o.destination), hubAddress],
  };
  const total = ethAllocation.map(o => o.amount).reduce(addHex);
  const jointOutcome = addToEthAllocation(
    { amount: total, destination: hubAddress },
    startingOutcome,
  );

  const jointChannelInitialized = advanceChannel.initializeAdvanceChannel(sharedData, {
    ...initializationArgs,
    ...channelSpecificArgs(jointOutcome),
    chainId,
    challengeDuration,
  });

  return {
    protocolState: states.waitForJointChannel({
      processId,
      jointChannel: jointChannelInitialized.protocolState,
      targetChannelId,
      ourAddress,
      startingOutcome,
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
  const { processId, hubAddress, ourAddress, protocolLocator } = protocolState;
  if (routesToAdvanceChannel(action, protocolState.protocolLocator)) {
    const result = advanceChannelReducer(protocolState.jointChannel, sharedData, action);

    if (advanceChannel.isSuccess(result.protocolState)) {
      const { channelId: jointChannelId } = result.protocolState;
      switch (result.protocolState.stateType) {
        case StateType.PreFunding:
          const jointChannelResult = advanceChannel.initializeAdvanceChannel(result.sharedData, {
            clearedToSend: true,
            stateType: StateType.PostFunding,
            processId,
            protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
            channelId: jointChannelId,
          });

          return {
            protocolState: {
              ...protocolState,
              jointChannel: jointChannelResult.protocolState,
            },
            sharedData: jointChannelResult.sharedData,
          };
        case StateType.PostFunding:
          const { targetChannelId } = protocolState;
          const privateKey = getPrivateKey(sharedData);

          const { challengeDuration, channel } = getLastStateForChannel(
            sharedData,
            targetChannelId,
          ).state;
          const { chainId } = channel;
          const destinations = [targetChannelId, ourAddress, hubAddress];
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            result.sharedData,
            {
              clearedToSend: true,
              stateType: StateType.PostFunding,
              processId,
              protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
              privateKey,
              ourAddress,
              appDefinition: CONSENSUS_LIBRARY_ADDRESS,
              challengeDuration,
              participants: [ourAddress, hubAddress],
              chainId,

              ...channelSpecificArgs([
                {
                  assetHolderAddress: ETH_ASSET_HOLDER,
                  guarantee: { targetChannelId: jointChannelId, destinations },
                },
              ]),
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
  const { processId, ourAddress, protocolLocator } = protocolState;
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
      switch (result.protocolState.stateType) {
        case StateType.PreFunding:
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            result.sharedData,
            {
              clearedToSend: true,
              stateType: StateType.PreFunding,
              processId,
              protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
              channelId: guarantorChannelId,
              ourAddress,
            },
          );
          return {
            protocolState: {
              ...protocolState,
              guarantorChannel: guarantorChannelResult.protocolState,
            },
            sharedData: guarantorChannelResult.sharedData,
          };

        case StateType.PostFunding:
          const startingOutcome: Outcome = [];

          const ledgerFundingResult = ledgerFunding.initializeLedgerFunding({
            processId,
            channelId: result.protocolState.channelId,
            startingOutcome,
            participants: [sharedData.address, protocolState.hubAddress],
            sharedData: result.sharedData,
            protocolLocator: makeLocator(
              protocolState.protocolLocator,
              EmbeddedProtocol.LedgerFunding,
            ),
          });
          switch (ledgerFundingResult.protocolState.type) {
            case 'LedgerFunding.Failure':
              return {
                protocolState: states.failure({}),
                sharedData: ledgerFundingResult.sharedData,
              };
            default:
              const { jointChannelId } = protocolState;
              // We initialize our joint channel sub-protocol early in case we receive a commitment before we're done funding
              const proposedOutcome = [];
              const applicationFundingResult = consensusUpdate.initializeConsensusUpdate({
                processId,
                channelId: jointChannelId,
                clearedToSend: false,
                proposedOutcome,
                protocolLocator: makeLocator(
                  protocolState.protocolLocator,
                  CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
                ),
                sharedData: ledgerFundingResult.sharedData,
              });
              return {
                protocolState: states.waitForGuarantorFunding({
                  ...protocolState,
                  indirectGuarantorFunding: ledgerFundingResult.protocolState,
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
  } else if (routesToLedgerFunding(action, protocolLocator)) {
    const result = ledgerFunding.ledgerFundingReducer(
      protocolState.indirectGuarantorFunding,
      sharedData,
      action,
    );

    switch (result.protocolState.type) {
      case 'LedgerFunding.Success':
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
      case 'LedgerFunding.Failure':
        throw new Error(`Indirect funding failed: ${result.protocolState.reason}`);

      default:
        return {
          protocolState: states.waitForGuarantorFunding({
            ...protocolState,

            indirectGuarantorFunding: result.protocolState,
          }),
          sharedData: result.sharedData,
        };
    }
  } else {
    console.warn(`Expected ledgerFunding or consensusUpdate action`);
    return { protocolState, sharedData };
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
          result.sharedData = setFundingState(result.sharedData, protocolState.targetChannelId, {
            directlyFunded: false,
            fundingChannel: protocolState.jointChannelId,
          });
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

function channelSpecificArgs(outcome: Outcome): { outcome: Outcome; appData: string } {
  return {
    outcome,
    appData: encodeConsensusData({ proposedOutcome: [], furtherVotesRequired: 0 }),
  };
}
