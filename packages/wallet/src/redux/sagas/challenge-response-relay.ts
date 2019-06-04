import { take, put } from 'redux-saga/effects';
import { ResponseProvided } from '../protocols/dispute/responder/actions';

/**
 * A simple saga that dispatches a protocol action to a yieldingProcess when a challenge response is submitted.
 */
export function* challengeResponseRelay() {
  while (true) {
    const responseProvidedAction: ResponseProvided = yield take(
      'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED',
    );
    if (responseProvidedAction.action) {
      yield put(responseProvidedAction.action);
    }
  }
}
