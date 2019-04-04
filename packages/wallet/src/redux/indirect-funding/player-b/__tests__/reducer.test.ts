import * as states from '../state';
import * as actions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import { playerBReducer } from '../reducer';
import { itTransitionsProcedureToStateType } from '../../../__tests__/helpers';

const startingIn = type => `starting in ${type}`;
const whenActionArrives = type => `when ${type} arrives`;

function itTransitionToStateType(state, type) {
  itTransitionsProcedureToStateType('indirectFunding', state, type);
}

const { initializedState, channelId } = scenarios;
const defaultState = { ...initializedState };
const startingState = (state: states.PlayerBState) => ({
  ...defaultState,
  indirectFunding: state,
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
});
