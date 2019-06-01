import { ChallengeCreatedEvent } from '../actions';
import { take, select, put } from 'redux-saga/effects';
import * as selectors from '../selectors';
import { challengeCreated } from '../protocols/actions';
import { ledgerChallengeCreated } from '../protocols/indirect-defunding/actions';

/**
 * A simple saga that determines if a challenge created event requires the wallet to create a respond process
 */
export function* challengeResponseInitiator() {
  while (true) {
    const action: ChallengeCreatedEvent = yield take('WALLET.ADJUDICATOR.CHALLENGE_CREATED_EVENT');
    const { commitment, channelId, finalizedAt } = action;

    const channelState = yield select(selectors.getOpenedChannelState, channelId);

    const numParticipants = commitment.channel.participants.length;
    const ourCommitment = commitment.turnNum % numParticipants !== channelState.ourIndex;

    // Here we check to see if the challenge relates to a ledger channel which funds the app channel currently being concluded, and instead of putting the challengeCreated action (which spins up a new process), put a different action that can be routed directly to the concluding process that is already running.

    const channelFundingState = yield select(
      selectors.getChannelFundingState,
      'TODOcurrentChannel',
    );

    if (ourCommitment) {
      if (channelFundingState.fundingChannel === channelId) {
        yield put(
          ledgerChallengeCreated({
            commitment,
            expiresAt: finalizedAt,
            channelId,
            processId: 'TODOcurrentProcessId',
          }),
        );
      } else {
        yield put(challengeCreated({ commitment, expiresAt: finalizedAt, channelId }));
      }
    }
  }
}
