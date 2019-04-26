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
type Storage = SharedData;

export interface ReturnVal {
  state: CState;
  storage: Storage;
  sideEffects?;
}

export function concludingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ConcludingAction,
): ReturnVal {
  switch (action.type) {
    case 'CONCLUDING.CANCELLED':
      return concludingCancelled(state, storage);
    case 'CONCLUDE.SENT':
      return concludeSent(state, storage);
    case 'CONCLUDE.RECEIVED':
      return concludeReceived(state, storage);
    case 'DEFUND.CHOSEN':
      return defundChosen(state, storage);
    case 'DEFUND.FAILED':
      return defundFailed(state, storage);
    case 'DEFUND.SUCCEEDED':
      return defundSucceeded(state, storage);
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

  if (storage.activeAppChannelId) {
    const channelId = storage.activeAppChannelId;

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
        penultimateCommitment: storage.channelStore[channelId].lastCommitment,
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
  return { state: waitForDefund(state), storage };
}

function defundFailed(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForDefund') {
    return { state, storage };
  }
  return { state: acknowledgeFailure({ ...state, reason: 'DefundFailed' }), storage };
}

function defundSucceeded(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForDefund') {
    return { state, storage };
  }
  return { state: acknowledgeSuccess({ ...state }), storage };
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
