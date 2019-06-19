import * as states from './states';
import { SharedData, queueMessage, registerChannelToMonitor } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { CommitmentType, Commitment, getChannelId } from '../../../domain';
import { getChannel, signAndInitialize, nextParticipant } from '../../channel-store';
import { WalletAction } from '../../actions';
import * as selectors from '../../selectors';
import { sendCommitmentsReceived } from '../../../communication';
import { Channel } from 'fmg-core';

type ReturnVal = ProtocolStateWithSharedData<states.AdvanceChannelState>;
type Storage = SharedData;

export function initialize(
  sharedData: Storage,
  commitmentType: CommitmentType,
  args: NewChannelArgs | OngoingChannelArgs,
): ReturnVal {
  if (commitmentType === CommitmentType.PreFundSetup) {
    if (!isNewChannelArgs(args)) {
      throw new Error('Must receive NewChannelArgs');
    }
    return initializeWithNewChannel(sharedData, args);
  } else {
    if (isNewChannelArgs(args)) {
      throw new Error('Must receive OngoingChannelArgs');
    }
    const { channelId } = args;
    const channel = getChannel(sharedData.channelStore, channelId);
    if (!channel) {
      throw new Error(`Could not find existing channel ${channelId}`);
    }
    return initializeWithExistingChannel(channel, advanceChannelProcessId, sharedData);
  }
}

export const reducer: ProtocolReducer<states.AdvanceChannelState> = (
  protocolState: states.AdvanceChannelState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  throw new Error('Unimplemented');
};

function advanceChannelProcessId(channelId: string, commitmentType: CommitmentType): string {
  return `AdvanceChannel-${channelId}-${commitmentType}`;
}

interface NewChannelArgs {
  ourIndex: number;
  allocation: string[];
  destination: string[];
  channelType: string;
  appAttributes: string;
  address: string;
  privateKey: string;
}

interface OngoingChannelArgs {
  channelId: string;
}

function isNewChannelArgs(args: NewChannelArgs | OngoingChannelArgs): args is NewChannelArgs {
  if ('channelId' in args) {
    return false;
  }
  return true;
}

function initializeWithNewChannel(sharedData: Storage, initializeChannelArgs: NewChannelArgs) {
  if (isSafeToSend(sharedData, CommitmentType.PreFundSetup, initializeChannelArgs)) {
    const { channelType, destination, appAttributes, allocation, ourIndex } = initializeChannelArgs;

    // Initialize the channel in the store
    const nonce = selectors.getNextNonce(sharedData, channelType);
    const participants = destination;
    const channel: Channel = {
      nonce,
      participants,
      channelType,
    };
    const ourCommitment: Commitment = {
      turnNum: 0,
      commitmentCount: 0,
      commitmentType: CommitmentType.PreFundSetup,
      appAttributes,
      allocation,
      destination,
      channel,
    };
    const { address, privateKey } = initializeChannelArgs;
    const signResult = signAndInitialize(
      sharedData.channelStore,
      ourCommitment,
      address,
      privateKey,
    );
    if (!signResult.isSuccess) {
      throw new Error('Could not store new ledger channel commitment.');
    }
    sharedData = { ...sharedData, channelStore: signResult.store };

    // Register channel to monitor
    const channelId = getChannelId(ourCommitment);
    const processId = advanceChannelProcessId(channelId, CommitmentType.PreFundSetup);
    sharedData = registerChannelToMonitor(sharedData, processId, channelId);

    // Send commitments to next participant
    const messageRelay = sendCommitmentsReceived(
      nextParticipant(participants, ourIndex),
      advanceChannelProcessId(channelId, CommitmentType.PreFundSetup),
      [signResult.signedCommitment],
    );
    sharedData = queueMessage(sharedData, messageRelay);

    const protocolState = states.commitmentSent({
      ...initializeChannelArgs,
      processId,
      channelId,
    });
    return {
      protocolState,
      sharedData,
    };
  } else {
    throw new Error('Unimplemented');
  }
}

function initializeWithExistingChannel(channel, processId, sharedData) {
  const { ourIndex, channelId } = channel;
  return { protocolState: states.notSafeToSend({ processId, channelId, ourIndex }), sharedData };
}

function isSafeToSend(
  sharedData: SharedData,
  commitmentType: CommitmentType,
  initializeChannelArgs: NewChannelArgs,
): boolean {
  return true;
}
