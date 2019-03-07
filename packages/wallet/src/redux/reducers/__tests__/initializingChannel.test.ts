import { initializingChannelReducer } from '../initializingChannel';

import * as states from '../../states';
import * as actions from '../../actions';
import { WaitForPreFundSetup } from '../../states';

const defaults = { uid: 'uid', adjudicator: 'adjudicator', networkId: 1 };

describe('when in WaitForAddress', () => {
  const state = states.waitForAddress(defaults);

  describe('when the player initializes a channel', () => {
    const action = actions.channelInitialized();
    const updatedState = initializingChannelReducer(state, action);

    it('transitions to WAIT_FOR_PRE_FUND_SETUP', async () => {
      expect((updatedState.channelState as WaitForPreFundSetup).type).toEqual(
        states.WAIT_FOR_PRE_FUND_SETUP,
      );
    });
  });
});
