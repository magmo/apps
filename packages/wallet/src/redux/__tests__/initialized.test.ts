import { walletReducer } from '../reducer';

import * as states from './../state';
import * as actions from './../actions';
import * as scenarios from './test-scenarios';
import { PlayerIndex } from '../types';
import * as PlayerAReducer from '../protocols/indirect-funding/player-a/reducer';

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
  it("is routed to the protocol's initialize function", () => {});
  const action = actions.indirectFunding.fundingRequested(channelId, PlayerIndex.A);
  const initialize = jest.fn();
  Object.defineProperty(PlayerAReducer, 'initialize', { value: initialize });

  walletReducer(initializedState, action);
  expect(initialize).toHaveBeenCalledWith(action, states.EMPTY_SHARED_DATA);
});
