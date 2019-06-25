import * as states from './states';
import { SharedData, getPrivatekey } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { WalletAction, advanceChannel } from '../../actions';
import { isVirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { CommitmentType } from '../../../domain';
import { bytesFromAppAttributes, UpdateType } from 'fmg-nitro-adjudicator';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../constants';

type ReturnVal = ProtocolStateWithSharedData<states.VirtualFundingState>;
type Storage = SharedData;

interface InitializationArgs {
  ourIndex: number;
  targetChannelId: string;
  processId: string;
  allocation: string[];
  destination: string[];
}

export function initialize(sharedData: Storage, args: InitializationArgs): ReturnVal {
  const { ourIndex, processId, targetChannelId, allocation, destination } = args;
  const privateKey = getPrivatekey(sharedData, targetChannelId);
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation: allocation,
    proposedDestination: destination,
    furtherVotesRequired: 0,
    updateType: UpdateType.Consensus,
  });
  const channelType = CONSENSUS_LIBRARY_ADDRESS;

  const { protocolState: guarantorChannel } = advanceChannel.initializeAdvanceChannel(
    processId,
    sharedData,
    CommitmentType.PreFundSetup,
    {
      privateKey,
      ourIndex,
      commitmentType: CommitmentType.PreFundSetup,
      clearedToSend: true,
      processId,
      protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
      allocation,
      destination,
      channelType,
      appAttributes,
    },
  );
  const { protocolState: jointChannel } = advanceChannel.initializeAdvanceChannel(
    processId,
    sharedData,
    CommitmentType.PreFundSetup,
    {
      privateKey,
      ourIndex,
      commitmentType: CommitmentType.PreFundSetup,
      clearedToSend: true,
      processId,
      protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR,
      allocation,
      destination,
      channelType,
      appAttributes,
    },
  );
  return {
    protocolState: states.waitForChannelPreparation({
      processId,
      [states.GUARANTOR_CHANNEL_DESCRIPTOR]: guarantorChannel,
      [states.JOINT_CHANNEL_DESCRIPTOR]: jointChannel,
      targetChannelId,
    }),
    sharedData,
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
    case 'VirtualFunding.WaitForChannelPreparation': {
      return waitForChannelPreparationReducer(protocolState, sharedData, action);
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

function waitForChannelPreparationReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}

function waitForGuarantorFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}

function waitForApplicationFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  return { protocolState, sharedData };
}
