
import { delay } from 'redux-saga';
import { ethers } from 'ethers';

export function* ganacheMiner() {
  const port = process.env.DEV_GANACHE_PORT || 8545;
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(`http://localhost:${port}`);
  const DELAY_TIME = 30000; // 30 seconds


  yield provider.send('evm_mine', {});
  yield delay(DELAY_TIME);
}
