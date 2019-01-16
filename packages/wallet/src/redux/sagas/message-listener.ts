import { take, put } from "redux-saga/effects";
import * as incoming from 'wallet-comm/lib/interface/to-wallet';

import * as actions from "../actions";
import { eventChannel } from 'redux-saga';

export function* messageListener() {
  const postMessageEventChannel = eventChannel(emitter => {
    window.addEventListener('message', (event: Event) => {
      emitter(event);
    });
    return () => { /* End channel here*/ };
  });
  while (true) {
    const event = yield take(postMessageEventChannel);
    const action = event.data;
    switch (event.data.type) {
      case incoming.CREATE_CHALLENGE_REQUEST:
        yield put(actions.challengeRequested());
        break;
      case incoming.FUNDING_REQUEST:
        yield put(actions.fundingRequested());
        break;
      case incoming.INITIALIZE_REQUEST:
        yield put(actions.loggedIn(action.userId));
        break;
      case incoming.SIGNATURE_REQUEST:
        yield put(actions.ownPositionReceived(action.data));
        break;
      case incoming.VALIDATION_REQUEST:
        yield put(actions.opponentPositionReceived(action.data, action.signature));
        break;
      case incoming.RECEIVE_MESSAGE:
        yield put(actions.messageReceived(action.data, action.signature));
        break;
      case incoming.RESPOND_TO_CHALLENGE:
        yield put(actions.challengePositionReceived(action.position));
        break;
      case incoming.CONCLUDE_CHANNEL_REQUEST:
        yield put(actions.concludeRequested());
        break;
      default:
    }

  }

}



