// import { challengeWatcher } from '../challenge-watcher';
// import { channel } from 'redux-saga';
// import { AdjudicatorState } from '../../adjudicator-state/state';
// import * as actions from '../../actions';
// import { put } from 'redux-saga/effects';
// import { channelId, appState } from '../../../domain/commitments/__tests__';

describe('challenge-watcher', () => {
  it.skip('dispatches a challenge expired action for an expired challenge on a channel', () => {
    // TODO: Implement this once events are figured out
    // const mockEventChannel = channel();
    // const saga = challengeWatcher();
    // // getProvider call
    // saga.next();
    // // getProvider
    // saga.next({
    //   getBlock: blockNum => {
    //     /* Dummy Function */
    //   },
    // });
    // // construct blockMinedChannel
    // saga.next(mockEventChannel);
    // // Take from event channel
    // saga.next(5);
    // // Get Block
    // saga.next({ timestamp: 2 });
    // const adjudicatorState: AdjudicatorState = {
    //   [channelId]: {
    //     finalized: false,
    //     channelId,
    //     balance: '0x0',
    //     challenge: { expiresAt: 1, challengeState: appState({ turnNum: 20 }).state },
    //   },
    // };
    // // Select adjudicator state
    // saga.next(adjudicatorState);
    // const processId = 'abc';
    // const result = saga.next([{ processId, protocolLocator: [] }]).value;
    // expect(result).toEqual(
    //   put(
    //     actions.challengeExpiredEvent({ processId, protocolLocator: [], channelId, timestamp: 2 }),
    //   ),
    // );
  });
});
