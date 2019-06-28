import { Channel } from 'fmg-core';
import { ProtocolReducer, ProtocolStateWithSharedData } from '..';
import { CommitmentsReceived } from '../../../communication';
import { Commitment, CommitmentType, getChannelId, nextSetupCommitment } from '../../../domain';
import { unreachable } from '../../../utils/reducer-utils';
import { WalletAction } from '../../actions';
import { ChannelState, getChannel, getLastCommitment } from '../../channel-store';
import * as selectors from '../../selectors';
import {
  checkAndInitialize,
  getExistingChannel,
  registerChannelToMonitor,
  SharedData,
  signAndInitialize,
  signAndStore,
} from '../../state';
import { Properties } from '../../utils';
import * as helpers from '../reducer-helpers';
import { isAdvanceChannelAction } from './actions';
import * as states from './states';

export const ADVANCE_CHANNEL_PROTOCOL_LOCATOR = 'AdvanceChannel';

type ReturnVal = ProtocolStateWithSharedData<states.AdvanceChannelState>;
type Storage = SharedData;

export function initialize(
  processId: string,
  sharedData: Storage,
  commitmentType: CommitmentType,
  args: OngoingChannelArgs | NewChannelArgs,
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

    return initializeWithExistingChannel(processId, sharedData, args);
  }
}

export const reducer: ProtocolReducer<states.AdvanceChannelState> = (
  protocolState: states.NonTerminalAdvanceChannelState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isAdvanceChannelAction(action)) {
    console.error('Invalid action: expected WALLET.COMMON.COMMITMENTS_RECEIVED');
    return { protocolState, sharedData };
  }

  if (action.type === 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND') {
    return clearedToSendReducer(protocolState, sharedData);
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

function clearedToSendReducer(protocolState: states.AdvanceChannelState, sharedData: SharedData) {
  if (protocolState.type === 'AdvanceChannel.NotSafeToSend') {
    protocolState = { ...protocolState, clearedToSend: true };
    if (protocolState.type === 'AdvanceChannel.NotSafeToSend') {
      return attemptToAdvanceChannel(sharedData, protocolState, protocolState.channelId);
    } else {
      return { sharedData, protocolState };
    }
  } else if (protocolState.type === 'AdvanceChannel.ChannelUnknown') {
    return {
      sharedData,
      protocolState: states.channelUnknown({ ...protocolState, clearedToSend: true }),
    };
  } else {
    return { protocolState, sharedData };
  }
}

type NewChannelArgs = Properties<states.ChannelUnknown>;
type OngoingChannelArgs = Properties<states.NotSafeToSend>;

function isNewChannelArgs(args: OngoingChannelArgs | NewChannelArgs): args is NewChannelArgs {
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
  const {
    channelType,
    destination,
    appAttributes,
    allocation,
    ourIndex,
    clearedToSend,
    protocolLocator,
  } = initializeChannelArgs;

  if (isSafeToSend({ sharedData, ourIndex, clearedToSend })) {
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
    const signResult = signAndInitialize(sharedData, ourCommitment, privateKey);
    if (!signResult.isSuccess) {
      throw new Error('Could not store new ledger channel commitment.');
    }
    sharedData = signResult.store;

    // Register channel to monitor
    const channelId = getChannelId(ourCommitment);
    sharedData = registerChannelToMonitor(sharedData, processId, channelId);

    // Send commitments to next participant
    sharedData = helpers.sendCommitments(sharedData, processId, channelId, protocolLocator);
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

function initializeWithExistingChannel(
  processId,
  sharedData: Storage,
  initializeChannelArgs: OngoingChannelArgs,
) {
  const { channelId, ourIndex, clearedToSend, protocolLocator } = initializeChannelArgs;
  const channel = getChannel(sharedData.channelStore, channelId);
  if (isSafeToSend({ sharedData, ourIndex, clearedToSend })) {
    const lastCommitment = getLastCommitment(channel);
    const ourCommitment = nextSetupCommitment(lastCommitment);
    if (ourCommitment === 'NotASetupCommitment') {
      // We will have to refactor `nextSetupCommitment` to allow it to construct
      // conclude commitments
      throw new Error('lastCommitment was not a setup commitment');
    }
    const signResult = signAndStore(sharedData, ourCommitment);
    if (!signResult.isSuccess) {
      throw new Error('Could not store new ledger channel commitment.');
    }
    sharedData = signResult.store;

    sharedData = helpers.sendCommitments(sharedData, processId, channelId, protocolLocator);

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
    return { protocolState: states.notSafeToSend(initializeChannelArgs), sharedData };
  }
}

function attemptToAdvanceChannel(
  sharedData: SharedData,
  protocolState: states.ChannelUnknown | states.NotSafeToSend,
  channelId: string,
): { sharedData: SharedData; protocolState: states.AdvanceChannelState } {
  const { ourIndex, commitmentType, clearedToSend, protocolLocator, processId } = protocolState;

  let channel = getChannel(sharedData.channelStore, channelId);
  if (isSafeToSend({ sharedData, ourIndex, channelId, clearedToSend })) {
    // First, update the store with our response
    const theirCommitment = getLastCommitment(channel);
    const ourCommitment = nextSetupCommitment(theirCommitment);
    if (ourCommitment === 'NotASetupCommitment') {
      throw new Error('Not a Setup commitment');
    }

    const signResult = signAndStore(sharedData, ourCommitment);
    if (!signResult.isSuccess) {
      throw new Error(`Could not sign result: ${signResult.reason}`);
    }
    sharedData = signResult.store;

    // Finally, send the commitments to the next participant
    channel = getChannel(sharedData.channelStore, channelId);

    sharedData = helpers.sendCommitments(sharedData, processId, channelId, protocolLocator);
    channel = getExistingChannel(sharedData, channelId);
    if (channelAdvanced(channel, commitmentType)) {
      return { protocolState: states.success(protocolState), sharedData };
    } else {
      return { protocolState: states.commitmentSent({ ...protocolState, channelId }), sharedData };
    }
  } else {
    return { protocolState, sharedData };
  }
}

const channelUnknownReducer = (
  protocolState: states.ChannelUnknown,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { privateKey } = protocolState;
  const channelId = getChannelId(action.signedCommitments[0].commitment);
  const checkResult = checkAndInitialize(sharedData, action.signedCommitments[0], privateKey);
  if (!checkResult.isSuccess) {
    throw new Error('Could not initialize channel');
  }
  sharedData = checkResult.store;
  sharedData = helpers.checkCommitments(sharedData, 0, action.signedCommitments);

  const result = attemptToAdvanceChannel(sharedData, protocolState, channelId);
  sharedData = result.sharedData;
  const nextProtocolState = result.protocolState; // The type might have changed, so we can't overwrite protocolState
  if (
    nextProtocolState.type === 'AdvanceChannel.CommitmentSent' ||
    nextProtocolState.type === 'AdvanceChannel.Success'
  ) {
    sharedData = registerChannelToMonitor(sharedData, protocolState.processId, channelId);
  }

  return { protocolState: nextProtocolState, sharedData };
};

const notSafeToSendReducer = (
  protocolState: states.NotSafeToSend,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { channelId } = protocolState;

  const channel = getChannel(sharedData.channelStore, channelId);
  sharedData = helpers.checkCommitments(sharedData, channel.turnNum, action.signedCommitments);

  return attemptToAdvanceChannel(sharedData, protocolState, channelId);
};

const commitmentSentReducer = (
  protocolState: states.CommitmentSent,
  sharedData,
  action: CommitmentsReceived,
) => {
  const { channelId, commitmentType } = protocolState;

  let channel = getChannel(sharedData.channelStore, channelId);
  sharedData = helpers.checkCommitments(sharedData, channel.turnNum, action.signedCommitments);

  channel = getChannel(sharedData.channelStore, channelId);
  if (channelAdvanced(channel, commitmentType)) {
    return { protocolState: states.success(protocolState), sharedData };
  }

  return { protocolState, sharedData };
};

function isSafeToSend({
  sharedData,
  channelId,
  ourIndex,
  clearedToSend,
}: {
  sharedData: SharedData;
  ourIndex: number;
  channelId?: string;
  clearedToSend: boolean;
}): boolean {
  if (!clearedToSend) {
    return false;
  }

  // The possibilities are:
  // A. The channel is not in storage and our index is 0.
  // B. The channel is not in storage and our index is not 0.
  // C. The channel is in storage and it's our turn
  // D. The channel is in storage and it's not our turn

  if (!channelId) {
    return ourIndex === 0;
  }

  const channel = getChannel(sharedData.channelStore, channelId);
  const numParticipants = channel.participants.length;
  return (channel.turnNum + 1) % numParticipants === ourIndex;
}

function channelAdvanced(channel: ChannelState, commitmentType: CommitmentType): boolean {
  const lastCommitment = getLastCommitment(channel);
  return (
    (lastCommitment.commitmentType === commitmentType &&
      lastCommitment.commitmentCount === channel.participants.length - 1) ||
    lastCommitment.commitmentType > commitmentType
  );
}
