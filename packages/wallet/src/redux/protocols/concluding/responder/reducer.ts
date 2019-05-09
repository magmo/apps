import {
  ConcludingState as CState,
  NonTerminalState as NonTerminalCState,
  approveConcluding,
  failure,
  waitForDefund,
  success,
  acknowledgeSuccess,
  acknowledgeFailure,
  decideDefund,
} from './states';
import { unreachable } from '../../../../utils/reducer-utils';
import { SharedData, getChannel, setChannelStore, queueMessage } from '../../../state';
import { composeConcludeCommitment } from '../../../../utils/commitment-utils';
import { ourTurn } from '../../../channel-store';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
type Storage = SharedData;
import { isSuccess, isFailure } from '../../defunding/states';
import * as selectors from '../../../selectors';
import * as channelStoreReducer from '../../../channel-store/reducer';
import { theirAddress } from '../../../channel-store';
import { sendConcludeChannel } from '../../../../communication';
import { showWallet } from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { isConcludingAction } from './actions';

export interface ReturnVal {
  state: CState;
  storage: Storage;
  sideEffects?;
}

export function concludingReducer(
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

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  const channelState = getChannel(storage, channelId);
  if (!channelState) {
    return {
      state: acknowledgeFailure({ processId, channelId, reason: 'ChannelDoesntExist' }),
      storage: showWallet(storage),
    };
  }
  if (ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return { state: approveConcluding({ channelId, processId }), storage: showWallet(storage) };
  } else {
    return {
      state: acknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }),
      storage: showWallet(storage),
    };
  }
}

function handleDefundingAction(
  state: NonTerminalCState,
  storage: Storage,
  action: DefundingAction,
): ReturnVal {
  if (state.type !== 'WaitForDefund') {
    return { state, storage };
  }
  const defundingState1 = state.defundingState;

  const protocolStateWithSharedData = defundingReducer(defundingState1, storage, action);
  const defundingState2 = protocolStateWithSharedData.protocolState;

  if (isSuccess(defundingState2)) {
    state = acknowledgeSuccess(state);
  } else if (isFailure(defundingState2)) {
    state = acknowledgeFailure({ ...state, reason: 'DefundFailed' });
  }
  return { state, storage };
}

function concludeSent(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'ApproveConcluding') {
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
      state: decideDefund({ ...state }),
      storage: sharedDataWithOwnCommitment,
    };
  } else {
    return { state, storage };
  }
}

function defundChosen(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'DecideDefund') {
    return { state, storage };
  }
  // initialize defunding state machine

  const protocolStateWithSharedData = initializeDefunding(
    state.processId,
    state.channelId,
    storage,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  return { state: waitForDefund({ ...state, defundingState }), storage };
}

function acknowledged(state: CState, storage: Storage): ReturnVal {
  switch (state.type) {
    case 'AcknowledgeSuccess':
      return { state: success(), storage };
    case 'AcknowledgeFailure':
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
    const messageRelay = sendConcludeChannel(
      theirAddress(channelState),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
      channelId,
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
