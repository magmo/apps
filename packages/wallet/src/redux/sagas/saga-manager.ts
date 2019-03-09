import { select, cancel, take, fork, actionChannel } from 'redux-saga/effects';

import { messageListener } from './message-listener';
import { messageSender } from './message-sender';
import { transactionSender } from './transaction-sender';
import { adjudicatorWatcher } from './adjudicator-watcher';
import { blockMiningWatcher } from './block-mining-watcher';

import { WalletState } from '../states';
import { getProvider } from '../../utils/contract-utils';

import { displaySender } from './display-sender';
import { ganacheMiner } from './ganache-miner';

export function* sagaManager(): IterableIterator<any> {
  let adjudicatorWatcherProcess;

  let blockMiningWatcherProcess;

  let ganacheMinerProcess;

  // always want the message listenter to be running
  yield fork(messageListener);

  // todo: restrict just to wallet actions
  const channel = yield actionChannel('*');

  while (true) {
    yield take(channel);

    const state: WalletState = yield select((walletState: WalletState) => walletState);

    // if have adjudicator, make sure that the adjudicator watcher is running
    if ('channelId' in state && state.adjudicator) {
      if (!adjudicatorWatcherProcess) {
        const provider = yield getProvider();
        adjudicatorWatcherProcess = yield fork(adjudicatorWatcher, state.channelId, provider);
      }
    } else {
      if (adjudicatorWatcherProcess) {
        yield cancel(adjudicatorWatcherProcess);
        adjudicatorWatcherProcess = undefined;
      }
    }

    // We only watch for mined blocks when waiting for a challenge expiry
    if ('challengeExpiry' in state && state.challengeExpiry) {
      if (!blockMiningWatcherProcess) {
        blockMiningWatcherProcess = yield fork(blockMiningWatcher);
      }
      if (process.env.TARGET_NETWORK === 'development' && !ganacheMinerProcess) {
        ganacheMinerProcess = yield fork(ganacheMiner);
      }
    } else {
      if (blockMiningWatcherProcess) {
        yield cancel(blockMiningWatcherProcess);
        blockMiningWatcherProcess = undefined;
      }
      if (ganacheMinerProcess) {
        yield cancel(ganacheMinerProcess);
        ganacheMinerProcess = undefined;
      }
    }

    if (state.messageOutbox) {
      const messageToSend = state.messageOutbox;
      yield messageSender(messageToSend);
    }
    if (state.displayOutbox) {
      const displayMessageToSend = state.displayOutbox;
      yield displaySender(displayMessageToSend);
    }
    // if we have an outgoing transaction, make sure that the transaction-sender runs
    if (state.transactionOutbox) {
      const transactionToSend = state.transactionOutbox;
      yield transactionSender(transactionToSend);
    }
  }
}
