import * as states from './states';
import { SharedData, getPrivatekey } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { WalletAction, advanceChannel } from '../../actions';
import { isVirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { CommitmentType } from '../../../domain';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator/lib/consensus-app';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../constants';
import { advanceChannelReducer } from '../advance-channel';
import * as consensusUpdate from '../consensus-update';
import * as indirectFunding from '../indirect-funding';
import { ethers } from 'ethers';
import { addHex } from '../../../utils/hex-utils';

type ReturnVal = ProtocolStateWithSharedData<states.VirtualFundingState>;

export function initialize(sharedData: SharedData, args: states.InitializationArgs): ReturnVal {
  const {
    ourIndex,
    processId,
    targetChannelId,
    startingAllocation,
    startingDestination,
    hubAddress,
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
    protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
    participants: [...startingDestination, hubAddress],
  };

  const jointAllocation = [...startingAllocation, startingAllocation.reduce(addHex)];
  const jointDestination = [...startingDestination, hubAddress];
  const jointChannelInitialized = advanceChannel.initializeAdvanceChannel(
    processId,
    sharedData,
    CommitmentType.PreFundSetup,
    {
      ...initializationArgs,
      ...channelSpecificArgs(jointAllocation, jointDestination),
    },
  );

  return {
    protocolState: states.waitForJointChannel({
      processId,
      jointChannel: jointChannelInitialized.protocolState,
      targetChannelId,
      startingAllocation,
      startingDestination,
      ourIndex,
      hubAddress,
    }),
    sharedData: jointChannelInitialized.sharedData,
  };
}

export const reducer: ProtocolReducer<states.VirtualFundingState> = (
  protocolState: states.NonTerminalVirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isVirtualFundingAction(action)) {
    console.error('Invalid action: expected WALLET.COMMON.COMMITMENTS_RECEIVED');
    return { protocolState, sharedData };
  }

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
  const { processId, hubAddress, ourIndex } = protocolState;
  if (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator === states.JOINT_CHANNEL_DESCRIPTOR
  ) {
    const result = advanceChannelReducer(protocolState.jointChannel, sharedData, action);

    if (advanceChannel.isSuccess(result.protocolState)) {
      const { channelId: jointChannelId } = result.protocolState;
      switch (result.protocolState.commitmentType) {
        case CommitmentType.PreFundSetup:
          const jointChannelResult = advanceChannel.initializeAdvanceChannel(
            processId,
            result.sharedData,
            CommitmentType.PostFundSetup,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PostFundSetup,
              processId,
              protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR,
              channelId: jointChannelId,
              ourIndex,
            },
          );

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
            processId,
            result.sharedData,
            CommitmentType.PreFundSetup,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PreFundSetup,
              processId,
              protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
              ourIndex,
              privateKey,
              channelType,
              participants: [ourAddress, hubAddress],
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
  const { processId, ourIndex } = protocolState;
  if (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator.indexOf(states.GUARANTOR_CHANNEL_DESCRIPTOR) === 0
  ) {
    const result = advanceChannelReducer(protocolState.guarantorChannel, sharedData, action);
    if (advanceChannel.isSuccess(result.protocolState)) {
      const { channelId: guarantorChannelId } = result.protocolState;
      switch (result.protocolState.commitmentType) {
        case CommitmentType.PreFundSetup:
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            processId,
            result.sharedData,
            CommitmentType.PostFundSetup,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PostFundSetup,
              processId,
              protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
              channelId: guarantorChannelId,
              ourIndex,
            },
          );
          return {
            protocolState: {
              ...protocolState,
              jointChannel: guarantorChannelResult.protocolState,
            },
            sharedData: guarantorChannelResult.sharedData,
          };

        case CommitmentType.PostFundSetup:
          const indirectFundingResult = indirectFunding.initializeIndirectFunding(
            processId,
            result.protocolState.channelId,
            result.sharedData,
          );
          return {
            protocolState: states.waitForGuarantorFunding({
              ...protocolState,
              indirectGuarantorFunding: indirectFundingResult.protocolState,
            }),
            sharedData: indirectFundingResult.sharedData,
          };

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
  const { processId, jointChannelId, startingAllocation, targetChannelId } = protocolState;
  if (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' &&
    action.protocolLocator &&
    action.protocolLocator.indexOf(states.INDIRECT_GUARANTOR_FUNDING_DESCRIPTOR) === 0
  ) {
    const result = indirectFunding.indirectFundingReducer(
      protocolState.indirectGuarantorFunding,
      sharedData,
      action,
    );
    if (indirectFunding.isTerminal(result.protocolState)) {
      switch (result.protocolState.type) {
        case 'IndirectFunding.Success':
          const proposedAllocation = [startingAllocation.reduce(addHex)];
          const proposedDestination = [targetChannelId];

          const applicationFundingResult = consensusUpdate.initializeConsensusUpdate(
            processId,
            jointChannelId,
            true,
            proposedAllocation,
            proposedDestination,
            result.sharedData,
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
  return { protocolState, sharedData };
}

function waitForApplicationFundingReducer(
  protocolState: states.WaitForApplicationFunding,
  sharedData: SharedData,
  action: WalletAction,
) {
  if (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator &&
    action.protocolLocator.indexOf(states.INDIRECT_APPLICATION_FUNDING_DESCRIPTOR) === 0
  ) {
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
      proposedAllocation: allocation,
      proposedDestination: destination,
      furtherVotesRequired: 0,
    }),
  };
}
