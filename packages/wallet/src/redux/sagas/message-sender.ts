import { put } from "redux-saga/effects";
import { messageSent } from "../actions";
import { INITIALIZATION_SUCCESS } from '../../interface/outgoing';


export function* messageSender(message) {
  console.log('message sender received ', message);
  if (message.type === INITIALIZATION_SUCCESS) {
    console.log('send message');
    window.parent.postMessage(message, '*');
  }
  yield put(message);
  yield put(messageSent());
}
