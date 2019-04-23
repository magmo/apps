import {
  ResigningState as RState,
  NonTerminalState as NonTerminalRState,
  approveResignation,
  failure,
  acknowledgeResignationImpossible,
  waitForOpponentConclude,
  acknowledgeChannelClosed,
  waitForDefund,
  success,
} from './states';
import { ResigningAction } from './actions';
import { unreachable, ourTurn } from '../../../utils/reducer-utils';
import { SharedData, getChannel } from '../../state';

type Storage = SharedData;

export interface ReturnVal {
  state: RState;
  storage: Storage;
}

export function resigningReducer(
  state: NonTerminalRState,
  storage: SharedData,
  action: ResigningAction,
): ReturnVal {
  switch (action.type) {
    case 'CONCLUDE.SENT':
      return concludeSent(state, storage);
    case 'RESIGNATION.IMPOSSIBLE.ACKNOWLEDGED':
      return resignationImpossibleAcknowledged(state, storage);
    case 'CONCLUDE.RECEIVED':
      return concludeReceived(state, storage);
    case 'DEFUND.CHOSEN':
      return defundChosen(state, storage);
    case 'DEFUND.NOT.CHOSEN':
      return defundNotChosen(state, storage);
    case 'DEFUNDED':
      return defunded(state, storage);
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  const channelState = getChannel(storage, channelId);
  if (!channelState) {
    return { state: failure({ reason: 'ChannelDoesntExist' }), storage };
  }
  if (ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return { state: approveResignation({ channelId, processId }), storage };
  } else {
    return { state: acknowledgeResignationImpossible({ channelId, processId }), storage };
  }
}

function resignationImpossibleAcknowledged(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'AcknowledgeResignationImpossible') {
    return { state, storage };
  }
  return { state: failure({ reason: 'NotYourTurn' }), storage };
}

function concludeSent(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'ApproveResignation') {
    return { state, storage };
  }
  return { state: waitForOpponentConclude(state), storage };
  // TODO craft conclude commitment
  // TODO send to opponent
}

function concludeReceived(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForOpponentConclude') {
    return { state, storage };
  }
  return { state: acknowledgeChannelClosed(state), storage };
}

function defundChosen(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'AcknowledgeChannelClosed') {
    return { state, storage };
  }
  return { state: waitForDefund(state), storage };
}

function defundNotChosen(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'AcknowledgeChannelClosed') {
    return { state, storage };
  }
  return { state: success(), storage };
}

function defunded(state: NonTerminalRState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForDefund') {
    return { state, storage };
  }
  return { state: success(), storage };
}
