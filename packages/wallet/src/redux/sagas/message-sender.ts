import { put } from 'redux-saga/effects';
import { messageSent } from '../actions';
import { responseProvided } from '../protocols/indirect-defunding/actions';

export function* messageSender(message) {
  if (message.type === 'WALLET.CHALLENGING.CHALLENGE_COMPLETE') {
    yield put(responseProvided({ processId: 'TODO' }));
  }
  window.parent.postMessage(message, '*');
  yield put(message);
  yield put(messageSent({}));
}
