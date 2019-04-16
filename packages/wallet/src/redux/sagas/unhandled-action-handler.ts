import { take, select, put } from 'redux-saga/effects';
import { getUnhandledActions, getRunningProcessIds } from '../selectors';

export function* unhandledActionHandler() {
  while (true) {
    // Take every action, and check if there is an unhandled action with a now-running
    // process. If so, yield the first such action.
    //
    // When a new action is handled that creates a process, this creates a domino
    // effect that will flush every element from the queue that's for a now-running
    // process
    yield take('*');

    const unhandledActions = yield select(getUnhandledActions);
    const runningProcessIds = yield select(getRunningProcessIds);
    const unhandledAction = unhandledActions.find(a => runningProcessIds.indexOf(a.processId) >= 0);
    if (unhandledAction) {
      yield put(unhandledAction);
    }
  }
}
