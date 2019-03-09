import { initializedReducer } from '../initialized';

import * as states from '../../states';
import * as actions from '../../actions';
import * as channelStates from '../../states/channels';
import { INITIALIZING_CHANNEL, CHANNEL_INITIALIZED } from '../../states';
import * as scenarios from './test-scenarios';

const defaults = {
  uid: 'uid',
  adjudicator: 'adjudicator',
  networkId: 1,
  outboxState: {},
};

const { preFundCommitment1 } = scenarios;

describe('when in WAITING_FOR_CHANNEL_INITIALIZATION', () => {
  const state = states.waitingForChannelInitialization({ ...defaults });

  describe('when the player initializes a channel', () => {
    const action = actions.channelInitialized();
    const updatedState = initializedReducer(state, action);

    it('transitions to INITIALIZING_CHANNEL', async () => {
      expect(updatedState.type).toEqual(INITIALIZING_CHANNEL);
      expect((updatedState.channelState as channelStates.WaitForChannel).type).toEqual(
        channelStates.WAIT_FOR_CHANNEL,
      );
    });
  });
});

describe('when in INITIALIZING_CHANNEL', () => {
  const state = states.initializingChannel({
    ...defaults,
    channelState: { address: 'address', privateKey: 'privateKey' },
  });

  describe('when the participant sends a commitment', () => {
    const action = actions.ownCommitmentReceived(preFundCommitment1);
    const updatedState = initializedReducer(state, action);

    it('transitions to CHANNEL_INITIALIZED', async () => {
      expect(updatedState.type).toEqual(CHANNEL_INITIALIZED);
      expect((updatedState.channelState as channelStates.WaitForPreFundSetup).type).toEqual(
        channelStates.WAIT_FOR_CHANNEL,
      );
    });
  });
});
