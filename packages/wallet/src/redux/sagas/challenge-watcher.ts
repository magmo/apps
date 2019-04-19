import * as actions from '../actions';
import * as selectors from '../selectors';
import { take, select, put } from 'redux-saga/effects';
import { AdjudicatorState, getAdjudicatorChannelState } from '../adjudicator-state/state';
import { getProvider } from '../../utils/contract-utils';
import { eventChannel } from 'redux-saga';

export function* challengeWatcher() {
  const provider = yield getProvider();
  const blockMinedChannel = yield createBlockMinedEventChannel(provider);

  while (true) {
    const blockNumber = yield take(blockMinedChannel);
    const block = yield provider.getBlock(blockNumber);

    const adjudicatorState: AdjudicatorState = yield select(selectors.getAdjudicatorState);

    for (const channelId of Object.keys(adjudicatorState)) {
      if (challengeIsExpired(adjudicatorState, channelId, block.timestamp)) {
        const processIdsToAlert = yield select(
          selectors.getAdjudicatorWatcherProcessesForChannel,
          channelId,
        );
        yield dispatchChallengeExpiredActions(channelId, processIdsToAlert, block.timestamp);
      }
    }
  }
}

function* createBlockMinedEventChannel(provider) {
  eventChannel(emit => {
    provider.on('block', blockNumber => {
      emit(blockNumber);
    });

    return () => {
      provider.removeAllListeners('block');
    };
  });
}

function* dispatchChallengeExpiredActions(
  channelId: string,
  processIds: string[],
  timestamp: number,
) {
  for (const processId of processIds) {
    yield put(actions.challengeExpiredEvent(processId, channelId, timestamp));
  }
}

function challengeIsExpired(state: AdjudicatorState, channelId: string, blockTimestamp: number) {
  const channelState = getAdjudicatorChannelState(state, channelId);
  if (!channelState) {
    return false;
  }
  return channelState.challenge && channelState.challenge.expiresAt <= blockTimestamp;
}
