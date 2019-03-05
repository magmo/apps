
import { delay } from 'redux-saga';
import { ethers } from 'ethers';

export function* ganacheMiner() {
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(`http://localhost:${process.env.DEV_GANACHE_PORT}`);
  const DELAY_TIME = 30000; // 30 seconds
  yield provider.send('evm_mine', {});
  yield delay(DELAY_TIME);
}
