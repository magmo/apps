import { ChallengingAction } from './actions';
import { ChallengingState as CState } from './states';
import { unreachable } from '../../../utils/reducer-utils';
import { SharedData } from '..';

type Storage = SharedData;

export interface ReturnVal {
  state: CState;
  storage: Storage;
}
export function challengingReducer(
  state: CState,
  storage: SharedData,
  action: ChallengingAction,
): ReturnVal {
  switch (action.type) {
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  return { state: waitForSend({ transaction, processId }), storage };
}
