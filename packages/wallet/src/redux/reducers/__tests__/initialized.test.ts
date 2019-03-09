import { initializedReducer } from '../initialized';

import * as states from '../../states';
import * as actions from '../../actions';
import * as channelStates from '../../states/channels';

const defaults = {
  uid: 'uid',
  adjudicator: 'adjudicator',
  networkId: 1,
  outboxState: {},
  channelState: { address: 'address', privateKey: 'privateKey' },
};

describe('when in WaitForAddress', () => {
  const state = states.initializingChannel({ ...defaults });

  describe('when the player initializes a channel', () => {
    const action = actions.channelInitialized();
    const updatedState = initializedReducer(state, action);

    it('transitions to WAIT_FOR_CHANNEL', async () => {
      expect((updatedState.channelState as channelStates.WaitForChannel).type).toEqual(
        channelStates.WAIT_FOR_CHANNEL,
      );
    });
  });
});
