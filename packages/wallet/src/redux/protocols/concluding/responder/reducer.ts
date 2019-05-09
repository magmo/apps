import {
  ResponderConcludingState as CState,
  ResponderNonTerminalState as NonTerminalCState,
  responderApproveConcluding,
  responderWaitForDefund,
  responderAcknowledgeSuccess,
  responderAcknowledgeFailure,
  responderDecideDefund,
} from './states';
import { unreachable } from '../../../../utils/reducer-utils';
import {
  SharedData,
  getChannel,
  setChannelStore,
  queueMessage,
  checkAndStore,
} from '../../../state';
import { composeConcludeCommitment } from '../../../../utils/commitment-utils';
import { ourTurn } from '../../../channel-store';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
type Storage = SharedData;
import { isSuccess, isFailure } from '../../defunding/states';
import * as selectors from '../../../selectors';
import * as channelStoreReducer from '../../../channel-store/reducer';
import { theirAddress } from '../../../channel-store';
import { sendConcludeInstigated } from '../../../../communication';
import { showWallet } from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { isConcludingAction } from './actions';
import { getChannelId, SignedCommitment } from '../../../../domain';
import { failure, success } from '../state';

export interface ReturnVal {
  state: CState;
  storage: Storage;
  sideEffects?;
}

export function responderConcludingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (isDefundingAction(action)) {
    return handleDefundingAction(state, storage, action);
  }

  if (!isConcludingAction(action)) {
    return { state, storage };
  }

  switch (action.type) {
    case 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_SENT':
      return concludeSent(state, storage);
    case 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN':
      return defundChosen(state, storage);
    case 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED':
      return acknowledged(state, storage);
    default:
      return unreachable(action);
  }
}

export function initialize(
  signedCommitment: SignedCommitment,
  processId: string,
  storage: Storage,
): ReturnVal {
  const channelId = getChannelId(signedCommitment.commitment);
  const channelState = getChannel(storage, channelId);
  if (!channelState) {
    return {
      state: responderAcknowledgeFailure({ processId, channelId, reason: 'ChannelDoesntExist' }),
      storage: showWallet(storage),
    };
  }

  const checkResult = checkAndStore(storage, signedCommitment);
  if (!checkResult.isSuccess) {
    throw new Error('Concluding responding protocol, unable to validate or store commitment');
  }
  const updatedStorage = checkResult.store;

  if (ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return {
      state: responderApproveConcluding({ channelId, processId }),
      storage: showWallet(updatedStorage),
    };
  } else {
    return {
      state: responderAcknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }),
      storage: showWallet(storage),
    };
  }
}

function handleDefundingAction(
  state: NonTerminalCState,
  storage: Storage,
  action: DefundingAction,
): ReturnVal {
  if (state.type !== 'ResponderWaitForDefund') {
    return { state, storage };
  }
  const defundingState1 = state.defundingState;

  const protocolStateWithSharedData = defundingReducer(defundingState1, storage, action);
  const defundingState2 = protocolStateWithSharedData.protocolState;

  if (isSuccess(defundingState2)) {
    state = responderAcknowledgeSuccess(state);
  } else if (isFailure(defundingState2)) {
    state = responderAcknowledgeFailure({ ...state, reason: 'DefundFailed' });
  }
  return { state, storage };
}

function concludeSent(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'ResponderApproveConcluding') {
    return { state, storage };
  }

  const channelState = getChannel(storage, state.channelId);

  if (channelState) {
    const sharedDataWithOwnCommitment = createAndSendConcludeCommitment(
      storage,
      state.processId,
      state.channelId,
    );
    return {
      state: responderDecideDefund({ ...state }),
      storage: sharedDataWithOwnCommitment,
    };
  } else {
    return { state, storage };
  }
}

function defundChosen(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'ResponderDecideDefund') {
    return { state, storage };
  }
  // initialize defunding state machine

  const protocolStateWithSharedData = initializeDefunding(
    state.processId,
    state.channelId,
    storage,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  return { state: responderWaitForDefund({ ...state, defundingState }), storage };
}

function acknowledged(state: CState, storage: Storage): ReturnVal {
  switch (state.type) {
    case 'ResponderAcknowledgeSuccess':
      return { state: success(), storage };
    case 'ResponderAcknowledgeFailure':
      return { state: failure({ reason: state.reason }), storage };
    default:
      return { state, storage };
  }
}

//  Helpers
const createAndSendConcludeCommitment = (
  sharedData: SharedData,
  processId: string,
  channelId: string,
): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const commitment = composeConcludeCommitment(channelState);

  const signResult = channelStoreReducer.signAndStore(sharedData.channelStore, commitment);
  if (signResult.isSuccess) {
    const sharedDataWithOwnCommitment = setChannelStore(sharedData, signResult.store);
    const messageRelay = sendConcludeInstigated(
      theirAddress(channelState),
      processId,
      signResult.signedCommitment,
    );
    return queueMessage(sharedDataWithOwnCommitment, messageRelay);
  } else {
    throw new Error(
      `Direct funding protocol, createAndSendPostFundCommitment, unable to sign commitment: ${
        signResult.reason
      }`,
    );
  }
};
