import { LockChannelRequest, channelLocked, channelUnlocked } from '../actions';
import { take, takeEvery, put, call } from 'redux-saga/effects';

export function* channelLocker() {
  yield takeEvery('WALLET.LOCKING.LOCK_CHANNEL_REQUEST', lockChannel);
}

function* lockChannel(lockRequest: LockChannelRequest) {
  let resolveLock;
  const lockPromise = new Promise(resolve => (resolveLock = resolve));
  (navigator as any).locks.request(
    lockRequest.channelId,
    { ifAvailable: true },
    lock => lockPromise,
  );
  const { processId, channelId } = lockRequest;
  yield put(channelLocked({ channelId, processId }));
  yield take(
    unlockAction =>
      unlockAction.type === 'WALLET.LOCKING.UNLOCK_CHANNEL_REQUEST' &&
      unlockAction.channelId === lockRequest.channelId,
  );
  yield call(resolveLock);
  yield put(channelUnlocked({ channelId, processId }));
}
