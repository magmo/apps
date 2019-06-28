import { walletReducer } from '../reducer';

import * as actions from '../actions';
import * as states from '../state';

describe('when in WaitForLogin', () => {
  const state = states.waitForLogin();

  describe('when the player logs in', () => {
    const action = actions.loggedIn({ uid: 'uid' });
    const updatedState = walletReducer(state, action);

    it('transitions to WALLET_INITIALIZED', async () => {
      expect(updatedState.type).toEqual(states.WALLET_INITIALIZED);
    });
  });
});
