import { SharedData, getExistingChannel } from '../../state';
import { ProtocolStateWithSharedData, makeLocator } from '..';
import { ChannelSyncState } from './states';
import { sendCommitments, checkCommitments } from '../reducer-helpers';
import * as states from './states';
import { ChannelSyncAction, isChannelSyncAction } from './actions';
import { EmbeddedProtocol } from '../../../communication';
export const CHANNEL_SYNC_PROTOCOL_LOCATOR = makeLocator(EmbeddedProtocol.ChannelSync);

export function initialize(
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChannelSyncState> {
  const channel = getExistingChannel(sharedData, channelId);
  let updatesLeft = channel.participants.length;
  if (ourTurnToSend(sharedData, channelId, updatesLeft)) {
    sharedData = sendCommitments(sharedData, processId, channelId, CHANNEL_SYNC_PROTOCOL_LOCATOR);
    updatesLeft--;
  }
  return { protocolState: states.waitForUpdate({ processId, channelId, updatesLeft }), sharedData };
}

export const channelSyncReducer = (
  protocolState: states.ChannelSyncState,
  sharedData: SharedData,
  action: ChannelSyncAction,
): ProtocolStateWithSharedData<states.ChannelSyncState> => {
  if (!isChannelSyncAction(action)) {
    console.warn(`Channel Sync received non Channel Sync action ${action}`);
    return { protocolState, sharedData };
  }
  if (protocolState.type !== 'ChannelSync.WaitForUpdate') {
    console.warn(`Consensus update reducer was called with terminal state ${protocolState.type}`);
    return { protocolState, sharedData };
  }
  const { channelId, processId } = protocolState;
  const { turnNum } = getExistingChannel(sharedData, channelId);
  sharedData = checkCommitments(sharedData, turnNum, action.signedCommitments);
  let updatesLeft = protocolState.updatesLeft - 1;
  if (ourTurnToSend(sharedData, channelId, updatesLeft)) {
    sharedData = sendCommitments(sharedData, processId, channelId, CHANNEL_SYNC_PROTOCOL_LOCATOR);
    updatesLeft--;
  }

  if (updatesLeft === 0) {
    return { protocolState: states.success({}), sharedData };
  } else {
    return { protocolState: states.waitForUpdate({ ...protocolState, updatesLeft }), sharedData };
  }
};

function ourTurnToSend(sharedData: SharedData, channelId: string, updatesLeft: number) {
  const channel = getExistingChannel(sharedData, channelId);
  return channel.ourIndex === channel.participants.length - updatesLeft;
}
