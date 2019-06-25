import { take, fork } from 'redux-saga/effects';
import { MultipleWalletActions } from '../actions';

export function* multipleActionDispatcher() {
  const multipleWalletActions = yield take(MultipleWalletActions);
  const actions = multipleWalletActions.actions;
  yield actions.forEach(action => {
    return fork(action);
  });
}
