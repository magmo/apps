import { put } from 'redux-saga/effects';
import { messageSent } from '../actions';
import { concluded } from '../protocols/application/actions';

export function* messageSender(message) {
  window.parent.postMessage(message, '*');
  console.log(message);
  if (message.messagePayload) {
    const action = message.messagePayload;
    if (action.type === 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED') {
      const processId = `${action.protocol}-${action.channelId}`;
      yield put(concluded({ processId }));
    }
  }
  yield put(message);
  yield put(messageSent({}));
}
