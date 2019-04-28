import { SharedData, queueMessage } from '../../state';
import * as states from './state';
import * as actions from './actions';
import { ProtocolStateWithSharedData } from '..';
import * as ethers from 'ethers';
import { updateChannelState } from '../reducer-helpers';
import * as channelActions from '../../channel-store/actions';
import { unreachable } from '../../../utils/reducer-utils';
import { channelID } from 'fmg-core/lib/channel';
import { channelInitializationSuccess } from 'magmo-wallet-client';

// TODO: Right now we're using a fixed application ID
// since we're not too concerned with handling multiple running app channels.
// This might need to change in the future.
export const APPLICATION_PROCESS_ID = 'Application';

export function initialize(
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ApplicationState> {
  const { privateKey, address } = ethers.Wallet.createRandom();
  const newSharedData = queueMessage(sharedData, channelInitializationSuccess(address));
  return {
    protocolState: states.addressKnown(address, privateKey),
    sharedData: newSharedData,
  };
}

export function applicationReducer(
  protocolState: states.ApplicationState,
  sharedData: SharedData,
  action: actions.ApplicationAction,
): ProtocolStateWithSharedData<states.ApplicationState> {
  return {
    protocolState: updateProtocolState(protocolState, action),
    sharedData: updateChannelStateWithCommitment(sharedData, action),
  };
}

const updateProtocolState = (
  protocolState: states.ApplicationState,
  action: actions.ApplicationAction,
): states.ApplicationState => {
  let channelId;
  if (protocolState.type === 'AddressKnown') {
    channelId = channelID(action.commitment.channel);
  } else {
    channelId = protocolState.channelId;
  }
  return states.ongoing(channelId);
};

const updateChannelStateWithCommitment = (
  sharedData: SharedData,
  action: actions.ApplicationAction,
): SharedData => {
  switch (action.type) {
    case 'APPLICATION.OPPONENT_COMMITMENT_RECEIVED':
      const { commitment, signature } = action;
      return updateChannelState(
        sharedData,
        channelActions.opponentCommitmentReceived(commitment, signature),
      );
      break;
    case 'APPLICATION.OWN_COMMITMENT_RECEIVED':
      return updateChannelState(
        sharedData,
        channelActions.ownCommitmentReceived(action.commitment),
      );
      break;
    default:
      return unreachable(action);
  }
};
