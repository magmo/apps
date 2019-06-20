import * as states from './states';
import {
  SharedData,
  queueMessage,
  registerChannelToMonitor,
  setChannel,
  checkAndStore,
} from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { CommitmentType, Commitment, getChannelId } from '../../../domain';
import {
  getChannel,
  signAndInitialize,
  nextParticipant,
  getLastCommitment,
  validTransitions,
  ChannelState,
  Commitments,
} from '../../channel-store';
import { WalletAction } from '../../actions';
import * as selectors from '../../selectors';
import { sendCommitmentsReceived, CommitmentsReceived } from '../../../communication';
import { Channel } from 'fmg-core';
import { isAdvanceChannelAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';

type ReturnVal = ProtocolStateWithSharedData<states.AdvanceChannelState>;
type Storage = SharedData;

export function initialize(
  processId: string,
  sharedData: Storage,
  commitmentType: CommitmentType,
  args: NewChannelArgs | OngoingChannelArgs,
): ReturnVal {
  if (commitmentType === CommitmentType.PreFundSetup) {
    if (!isNewChannelArgs(args)) {
      throw new Error('Must receive NewChannelArgs');
    }
    return initializeWithNewChannel(processId, sharedData, args);
  } else {
    if (isNewChannelArgs(args)) {
      throw new Error('Must receive OngoingChannelArgs');
    }
    const { channelId } = args;
    const channel = getChannel(sharedData.channelStore, channelId);
    if (!channel) {
      throw new Error(`Could not find existing channel ${channelId}`);
    }
    return initializeWithExistingChannel(channel, processId, sharedData);
  }
}

export const reducer: ProtocolReducer<states.AdvanceChannelState> = (
  protocolState: states.NonTerminalAdvanceChannelState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isAdvanceChannelAction(action)) {
    console.error('Invalid action: expected WALLET.ADVANCE_CHANNEL.COMMITMENTS_RECEIVED');
    return { protocolState, sharedData };
  }

  switch (protocolState.type) {
    case 'AdvanceChannel.ChannelUnknown': {
      return channelUnknownReducer(protocolState, sharedData, action);
    }
    case 'AdvanceChannel.NotSafeToSend': {
      return notSafeToSendReducer(protocolState, sharedData, action);
    }
    case 'AdvanceChannel.CommitmentSent': {
      return commitmentSentReducer(protocolState, sharedData, action);
    }
    default:
      return unreachable(protocolState);
  }
};

interface NewChannelArgs {
  ourIndex: number;
  allocation: string[];
  destination: string[];
  channelType: string;
  appAttributes: string;
  privateKey: string;
}

interface OngoingChannelArgs {
  channelId: string;
}

function isNewChannelArgs(args: NewChannelArgs | OngoingChannelArgs): args is NewChannelArgs {
  if ('privateKey' in args) {
    return true;
  }
  return false;
}

function initializeWithNewChannel(
  processId,
  sharedData: Storage,
  initializeChannelArgs: NewChannelArgs,
) {
  const { channelType, destination, appAttributes, allocation, ourIndex } = initializeChannelArgs;

  if (isSafeToSend({ sharedData, ourIndex })) {
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
    const { privateKey } = initializeChannelArgs;
    const signResult = signAndInitialize(sharedData.channelStore, ourCommitment, privateKey);
    if (!signResult.isSuccess) {
      throw new Error('Could not store new ledger channel commitment.');
    }
    sharedData = { ...sharedData, channelStore: signResult.store };

    // Register channel to monitor
    const channelId = getChannelId(ourCommitment);
    sharedData = registerChannelToMonitor(sharedData, processId, channelId);

    // Send commitments to next participant
    const messageRelay = sendCommitmentsReceived(
      nextParticipant(participants, ourIndex),
      processId,
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
    const protocolState = states.channelUnknown({
      ...initializeChannelArgs,
      processId,
    });

    return { protocolState, sharedData };
  }
}

function initializeWithExistingChannel(channel, processId, sharedData) {
  const { ourIndex, channelId } = channel;
  return { protocolState: states.notSafeToSend({ processId, channelId, ourIndex }), sharedData };
}

const channelUnknownReducer: ProtocolReducer<states.NonTerminalAdvanceChannelState> = (
  protocolState: states.ChannelUnknown,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { ourIndex } = protocolState;
  const channelId = getChannelId(action.signedCommitments[0].commitment);

  if (isSafeToSend({ sharedData, ourIndex, channelId })) {
    return { protocolState: states.commitmentSent({ ...protocolState, channelId }), sharedData };
  } else {
    return { protocolState, sharedData };
  }
};

function checkCommitments(sharedData: SharedData, commitments: Commitments): SharedData {
  commitments.map(sc => {
    const result = checkAndStore(sharedData, sc);
    if (result.isSuccess) {
      sharedData = result.store;
    } else {
      throw new Error('Unable to validate commitment');
    }
  });

  return sharedData;
}

const notSafeToSendReducer: ProtocolReducer<states.NonTerminalAdvanceChannelState> = (
  protocolState: states.NotSafeToSend,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { ourIndex, channelId } = protocolState;
  sharedData = checkCommitments(sharedData, action.signedCommitments);

  if (isSafeToSend({ sharedData, ourIndex, channelId })) {
    return { protocolState: states.commitmentSent({ ...protocolState, channelId }), sharedData };
  } else {
    return { protocolState, sharedData };
  }
};

const commitmentSentReducer: ProtocolReducer<states.AdvanceChannelState> = (
  protocolState: states.CommitmentSent,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { channelId } = protocolState;
  const channel = getChannel(sharedData.channelStore, channelId);
  if (!channel) {
    return { protocolState, sharedData };
  }

  const { signedCommitments } = action;

  if (advancesChannel(channel, signedCommitments)) {
    sharedData = setChannel(sharedData, { ...channel, commitments: signedCommitments });
    return { protocolState: states.success(protocolState), sharedData };
  }

  return { protocolState, sharedData };
};

function isSafeToSend({
  sharedData,
  channelId,
  ourIndex,
}: {
  sharedData: SharedData;
  ourIndex: number;
  channelId?: string;
}): boolean {
  // The possibilities are:
  // A. The channel is not in storage and our index is 0.
  // B. The channel is not in storage and our index is not 0.
  //   B1. It's our turn
  //   B2. It's not our turn
  // C. The channel is in storage
  //   C1. It's our turn
  //   C2. It's not our turn

  if (!channelId) {
    return ourIndex === 0;
  }

  const channel = getChannel(sharedData.channelStore, channelId);
  if (!channel) {
    console.error(`Could not find existing channel ${channelId}`);
    return false;
  }

  return true;
}

function advancesChannel(channel: ChannelState, newCommitments: Commitments): boolean {
  const lastCommitment = getLastCommitment(channel);
  return (
    newCommitments[0].commitment === lastCommitment &&
    validTransitions(newCommitments) &&
    newCommitments.length === lastCommitment.channel.participants.length
  );
}
