import {
  ConcludingState as CState,
  NonTerminalState as NonTerminalCState,
  approveConcluding,
  failure,
  waitForOpponentConclude,
  waitForDefund,
  success,
  acknowledgeSuccess,
  acknowledgeFailure,
  acknowledgeConcludeReceived,
} from './states';
import { ConcludingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { SharedData, getChannel } from '../../state';
import { composeConcludeCommitment } from '../../../utils/commitment-utils';
import { ChannelState, ourTurn } from '../../channel-store';
import { DefundingAction, isDefundingAction } from '../defunding/actions';
import { initialize as initializeDefunding, defundingReducer } from '../defunding/reducer';
type Storage = SharedData;
import { isSuccess, isFailure } from '../defunding/states';

export interface ReturnVal {
  state: CState;
  storage: Storage;
  sideEffects?;
}

export function concludingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ConcludingAction | DefundingAction,
): ReturnVal {
  if (isDefundingAction(action)) {
    return handleDefundingAction(state, storage, action);
  }
  switch (action.type) {
    case 'CONCLUDING.CANCELLED':
      return concludingCancelled(state, storage);
    case 'CONCLUDE.SENT':
      return concludeSent(state, storage);
    case 'CONCLUDE.RECEIVED':
      return concludeReceived(state, storage);
    case 'DEFUND.CHOSEN':
      return defundChosen(state, storage);
    case 'ACKNOWLEDGED':
      return acknowledged(state, storage);
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  const channelState = getChannel(storage, channelId);
  if (!channelState) {
    return { state: acknowledgeFailure({ processId, reason: 'ChannelDoesntExist' }), storage };
  }
  if (ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return { state: approveConcluding({ channelId, processId }), storage };
  } else {
    return { state: acknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }), storage };
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
  // const transactionState = retVal.state;

  if (isSuccess(defundingState2)) {
    state = acknowledgeSuccess(state);
  } else if (isFailure(defundingState2)) {
    state = acknowledgeFailure({ ...state, reason: 'DefundFailed' });
  } else {
    // update the transaction state?
    // state = { ...state, transactionSubmission: transactionState };
  }

  return { state, storage };
}

function concludingCancelled(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'ApproveConcluding') {
    return { state, storage };
  }
  return { state: failure({ reason: 'ConcludeCancelled' }), storage };
}

function concludeSent(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'ApproveConcluding') {
    return { state, storage };
  }

  if (storage.channelStore.activeAppChannelId) {
    const channelId = storage.channelStore.activeAppChannelId;

    const channelState = getChannel(storage, channelId) as ChannelState;

    const {
      concludeCommitment,
      commitmentSignature,
      sendCommitmentAction,
    } = composeConcludeCommitment(channelState);

    return {
      state: waitForOpponentConclude({
        ...state,
        turnNum: concludeCommitment.turnNum,
        penultimateCommitment: storage.channelStore.initializedChannels.lastCommitment,
        lastCommitment: { commitment: concludeCommitment, signature: commitmentSignature },
      }),
      sideEffects: { messageOutbox: sendCommitmentAction },
      storage,
    };
  }
  return { state: waitForOpponentConclude({ ...state }), storage };
  // TODO craft conclude commitment
  // TODO send to opponent
}

function concludeReceived(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForOpponentConclude') {
    return { state, storage };
  }
  return { state: acknowledgeConcludeReceived(state), storage };
}

function defundChosen(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'AcknowledgeConcludeReceived') {
    return { state, storage };
  }
  // initialize defunding state machine

  const protocolStateWithSharedData = initializeDefunding(state.processId, 'channelId', storage);
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
