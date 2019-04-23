import {
    ResigningState as RState,
    NonTerminalState as NonTerminalRState,
    approveResignation,
  } from './states';
import { ResigningAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { SharedData } from '../../state';


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
    case 'RESIGNATION.IMPOSSIBLE.ACKNOWLEDGED':
    case 'CONCLUDE.RECEIVED':
    case 'DEFUND.CHOSEN':
    case 'DEFUND.NOT.CHOSEN':
    case 'DEFUNDED':
        return {state, storage}; // placeholder
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
    // if our turn
   return { state: approveResignation({ channelId, processId }), storage };
   // if their turn
//    return { state: acknowledgeResignationImpossible({ channelId, processId }), storage };
}
