import { put } from 'redux-saga/effects';
import { internalMessageSent } from '../actions';

export function* internalMessageSender(action) {
  if (
    action.type === 'WALLET.NEW_PROCESS.CREATE_CHALLENGE_REQUESTED' ||
    action.type === 'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED' ||
    action.type === 'WALLET.COMMON.LEDGER_DISPUTE_DETECTED'
  ) {
    yield put(action);
    yield put(internalMessageSent({}));
  }
}
