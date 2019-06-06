import { take, put } from 'redux-saga/effects';
import { ResponseProvided, RespondApproved } from '../protocols/dispute/responder/actions';
import { CreateChallengeRequested } from '../protocols/actions';

/**
 * A simple saga that:
 * - dispatches an embedded ProtocolAction on 'WALLET.DISPUTE.RESPONDER.RESPOND_APPROVED' or 'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED'
 * -
 */

export function* ledgerDisputeRelay() {
  while (true) {
    const trigger: ResponseProvided | RespondApproved | CreateChallengeRequested = yield take(
      action => {
        return (
          action.type === 'WALLET.DISPUTE.RESPONDER.RESPOND_APPROVED' ||
          action.type === 'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED' ||
          action.type === 'WALLET.NEW_PROCESS.CREATE_CHALLENGE_REQUESTED'
        );
      },
    );

    if (trigger.embeddedProtocolAction) {
      yield put(trigger.embeddedProtocolAction);
    }
  }
}
