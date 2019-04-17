import { walletReducer } from '../reducer';

import * as states from './../state';
import * as actions from './../actions';
import * as scenarios from './test-scenarios';
import { PlayerIndex } from '../types';
import * as IndirectFunding from '../protocols/indirect-funding/reducer';

const { channelId } = scenarios;

const defaults = {
  ...states.EMPTY_SHARED_DATA,
  uid: 'uid',
  adjudicator: 'adjudicator',
  networkId: 1,
  consensusLibrary: '0x0',
  processStore: {},
};

const initializedState = states.initialized({ ...defaults });

describe('when the player initializes a channel', () => {
  const action = actions.channel.channelInitialized();
  const updatedState = walletReducer(initializedState, action);

  it('applies the channel reducer', async () => {
    const ids = Object.keys(updatedState.channelState.initializingChannels);
    expect(ids.length).toEqual(1);
    expect(updatedState.channelState.initializingChannels[ids[0]].privateKey).toEqual(
      expect.any(String),
    );
  });
});

describe('when a NewProcessAction arrives', () => {
  const processId = channelId;

  const action = actions.indirectFunding.fundingRequested(channelId, PlayerIndex.A);
  const initialize = jest.fn(() => ({
    protocolState: 'protocolState',
    sharedData: { prop: 'value' },
  }));
  Object.defineProperty(IndirectFunding, 'initialize', { value: initialize });

  const updatedState = walletReducer(initializedState, action);
  expect(initialize).toHaveBeenCalledWith(action, states.EMPTY_SHARED_DATA);

  expect((updatedState as states.Initialized).processStore).toMatchObject({
    [processId]: { protocolState: 'protocolState' },
  });
});
