import { ethers } from 'ethers';
import { delay } from 'redux-saga';

export function* ganacheMiner() {
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.GANACHE_PORT}`,
  );
  const DELAY_TIME = 30000; // 30 seconds
  while (true) {
    const timeStamp = Math.round(Date.now() / 1000);
    yield provider.send('evm_mine', timeStamp);
    yield delay(DELAY_TIME);
  }
}
