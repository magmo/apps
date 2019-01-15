import { put } from "redux-saga/effects";
import { messageSent } from "../actions";
import { FUNDING_SUCCESS, hideWallet } from 'wallet-comm/lib/interface/from-wallet';

export function* messageSender(message) {

  window.parent.postMessage(message, '*');
  // TODO: Handle other action types that indicate we should hide the wallet
  if (message.type === FUNDING_SUCCESS) {
    window.parent.postMessage(hideWallet(), '*');
  }
  yield put(message);
  yield put(messageSent());
}
