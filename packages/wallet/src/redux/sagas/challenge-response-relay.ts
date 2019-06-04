import { take, put } from 'redux-saga/effects';
import { ResponseProvided } from '../protocols/dispute/responder/actions';
import { CreateChallengeRequested } from '../protocols/actions';

/**
 * A simple saga that dispatches a protocol action to a yieldingProcess when a challenge response is submitted.
 */
export function* challengeResponseRelay() {
  while (true) {
    const trigger: ResponseProvided | CreateChallengeRequested = yield take(action => {
      return (
        action.type === 'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED' ||
        action.type === 'WALLET.NEW_PROCESS.CREATE_CHALLENGE_REQUESTED'
      );
    });

    if (trigger.action) {
      yield put(trigger.action);
    }
  }
}
