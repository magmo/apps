import { put } from 'redux-saga/effects';
import { messageSent } from '../actions';
import { concluded } from '../protocols/application/actions';
import { APPLICATION_PROCESS_ID } from '../protocols/application/reducer';

export function* messageSender(message) {
  window.parent.postMessage(message, '*');
  console.log(message);
  if (message.messagePayload) {
    const action = message.messagePayload;
    if (action.type === 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED') {
      const processId = APPLICATION_PROCESS_ID;
      yield put(concluded({ processId }));
    }
  }
  yield put(message);
  yield put(messageSent({}));
}
