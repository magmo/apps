import { channel } from 'redux-saga';
import { put } from 'redux-saga/effects';
import { channelId, gameCommitment2 } from '../../__tests__/test-scenarios';
import * as actions from '../../actions';
import { AdjudicatorState } from '../../adjudicator-state/state';
import { challengeWatcher } from '../challenge-watcher';

describe('challenge-watcher', () => {
  it('dispatches a challenge expired action for an expired challenge on a channel', () => {
    const mockEventChannel = channel();
    const saga = challengeWatcher();
    // getProvider call
    saga.next();
    // getProvider
    saga.next({
      getBlock: blockNum => {
        /* Dummy Function */
      },
    });
    // construct blockMinedChannel
    saga.next(mockEventChannel);
    // Take from event channel
    saga.next(5);
    // Get Block
    saga.next({ timestamp: 2 });
    const adjudicatorState: AdjudicatorState = {
      [channelId]: {
        finalized: false,
        channelId,
        balance: '0x0',
        challenge: { expiresAt: 1, challengeCommitment: gameCommitment2 },
      },
    };
    // Select adjudicator state
    saga.next(adjudicatorState);
    const processId = 'abc';
    const result = saga.next([processId]).value;

    expect(result).toEqual(
      put(actions.challengeExpiredEvent({ processId, channelId, timestamp: 2 })),
    );
  });
});
