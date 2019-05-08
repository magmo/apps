import { ethers } from 'ethers';
import { bigNumberify } from 'ethers/utils';
import { channelID } from 'fmg-core/lib/channel';
import AllocatorChannel from '../../models/allocatorChannel';
import { channel, depositContract } from './utils';
import { listen } from '../../adjudicator-watcher';

jest.setTimeout(60000);
const channelId = channelID(channel);
let removeListeners = null;

async function getHoldings() {
  return (await AllocatorChannel.query()
    .where('channel_id', channelId)
    .first()
    .select('holdings')).holdings;
}

describe('adjudicator listener', () => {
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.DEV_GANACHE_PORT}`,
  );

  it('should handle a funds received event when channel is in the database', async done => {
    const preEventHoldings = await getHoldings();

    const eventCallback = async eventType => {
      const postEventHoldings = await getHoldings();

      const eventDeposit = bigNumberify(postEventHoldings).sub(bigNumberify(preEventHoldings));
      expect(eventDeposit.toNumber()).toBeGreaterThan(5);
      done();
    };

    removeListeners = await listen(eventCallback);
    await depositContract(provider, channelId);
  });
});

afterEach(() => {
  removeListeners();
});
