import { SharedData, queueMessage } from '../../state';
import * as states from './state';
import * as actions from './actions';
import { ProtocolStateWithSharedData } from '..';
import * as ethers from 'ethers';
import { unreachable } from '../../../utils/reducer-utils';
import { channelID } from 'fmg-core/lib/channel';
import {
  channelInitializationSuccess,
  validationSuccess,
  signatureSuccess,
  signatureFailure,
  validationFailure,
} from 'magmo-wallet-client';
import { signAndStore, checkAndStore } from '../../channel-store/reducer';

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
    case actions.OPPONENT_COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      const validateResult = checkAndStore(sharedData.channelStore, { commitment, signature });
      if (!validateResult.isSuccess) {
        // TODO: Currently checkAndStore doesn't contain any validation messages
        // We might want to return a more descriptive message to the app?
        return queueMessage(sharedData, validationFailure('InvalidSignature'));
      } else {
        const updatedSharedData = { ...sharedData, channelStore: validateResult.store };
        return queueMessage(updatedSharedData, validationSuccess());
      }
      break;
    case actions.OWN_COMMITMENT_RECEIVED:
      const signResult = signAndStore(sharedData.channelStore, action.commitment);
      if (!signResult.isSuccess) {
        return queueMessage(sharedData, signatureFailure('Other', signResult.reason));
      } else {
        const updatedSharedData = { ...sharedData, channelStore: signResult.store };
        return queueMessage(
          updatedSharedData,
          signatureSuccess(signResult.signedCommitment.signature),
        );
      }
      break;
    default:
      return unreachable(action);
  }
};
