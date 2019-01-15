import { put } from "redux-saga/effects";
import { messageSent } from "../actions";
import { FUNDING_SUCCESS, hideWallet, CLOSE_SUCCESS } from 'wallet-comm/lib/interface/from-wallet';

export function* messageSender(message) {

  window.parent.postMessage(message, '*');
  // TODO: Handle other action types that indicate we should hide the wallet
  if ([FUNDING_SUCCESS, CLOSE_SUCCESS].indexOf(message.type) > -1) {
    window.parent.postMessage(hideWallet(), '*');
  }
  yield put(message);
  yield put(messageSent());
}
