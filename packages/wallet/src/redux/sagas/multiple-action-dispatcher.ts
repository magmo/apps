import { MultipleWalletActions } from '../actions';
import { take, all, put } from 'redux-saga/effects';

export function* multipleActionDispatcher() {
  while (true) {
    const multipleWalletActions: MultipleWalletActions = yield take('WALLET.MULTIPLE_ACTIONS');
    yield all(multipleWalletActions.actions.map(action => put(action)));
  }
}
