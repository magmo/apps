import * as states from '../state';
import * as walletStates from '../../../state';
import * as channelStates from '../../../channel-state/state';
import * as actions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import { playerBReducer } from '../reducer';
import { itTransitionsProcedureToStateType } from '../../../__tests__/helpers';
import { WalletProcedure } from '../../../types';

const startingIn = type => `starting in ${type}`;
const whenActionArrives = type => `when ${type} arrives`;

function itTransitionToStateType(state, type) {
  itTransitionsProcedureToStateType('indirectFunding', state, type);
}

const { initializedState, channelId, ledgerCommitments } = scenarios;
const { preFundCommitment1 } = ledgerCommitments;
const defaultState = { ...initializedState };
const startingState = (
  state: states.PlayerBState,
  channelState?: channelStates.OpenedState,
): walletStates.IndirectFundingOngoing => ({
  ...defaultState,
  indirectFunding: state,
  channelState: {
    ...channelStates.EMPTY_CHANNEL_STATE,
    initializedChannels: channelState ? { [channelState.channelId]: channelState } : {},
  },
});

describe(startingIn(states.WAIT_FOR_APPROVAL), () => {
  describe(whenActionArrives(actions.indirectFunding.playerB.STRATEGY_PROPOSED), () => {
    const state = startingState(states.waitForApproval({ channelId }));
    const action = actions.indirectFunding.playerB.strategyProposed(channelId);
    const updatedState = playerBReducer(state, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_PRE_FUND_SETUP_0);
  });
});

describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP_0), () => {
  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {});
  const state = startingState(states.waitForPreFundSetup0({ channelId }));
  const action = actions.commitmentReceived(
    channelId,
    WalletProcedure.IndirectFunding,
    preFundCommitment1,
    'signature',
  );
  const updatedState = playerBReducer(state, action);

  itTransitionToStateType(updatedState, states.WAIT_FOR_DIRECT_FUNDING);
});
