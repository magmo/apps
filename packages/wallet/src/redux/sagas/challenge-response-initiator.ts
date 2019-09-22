import { ChallengeCreatedEvent } from '../actions';
import { take, select, put } from 'redux-saga/effects';
import * as selectors from '../selectors';
import { challengeDetected } from '../protocols/application/actions';
import { APPLICATION_PROCESS_ID } from '../protocols/application/reducer';

/**
 * A simple saga that determines if a challenge created event requires the wallet to initialize a respond protocol
 */
export function* challengeResponseInitiator() {
  while (true) {
    const action: ChallengeCreatedEvent = yield take('WALLET.ADJUDICATOR.CHALLENGE_CREATED_EVENT');
    const { signedState, channelId, finalizedAt: expiresAt } = action;

    const channelState = yield select(selectors.getOpenedChannelState, channelId);

    const numParticipants = channelState.channel.participants.length;
    const ourCommitment = channelState.turnNumRecord % numParticipants !== channelState.ourIndex;

    if (ourCommitment) {
      yield put(
        challengeDetected({
          signedState,
          channelId,
          processId: APPLICATION_PROCESS_ID,
          expiresAt,
        }),
      );
    }
  }
}
