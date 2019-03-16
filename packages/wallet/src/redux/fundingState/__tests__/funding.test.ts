import { fundingStateReducer } from '../reducer';

import * as states from '../state';
import * as actions from '../../actions';

import * as scenarios from '../../__tests__/test-scenarios';
import { itTransitionsToStateType } from '../../__tests__/helpers';
import { bigNumberify } from 'ethers/utils';
import { SharedDirectFundingState, SharedUnknownFundingState } from '../shared/state';

const { channelId } = scenarios;

const TOTAL_REQUIRED = bigNumberify(1000000000000000).toHexString();
const YOUR_DEPOSIT_A = bigNumberify(100).toHexString();

const defaultsForUnknown: SharedUnknownFundingState = {
  fundingType: states.UNKNOWN_FUNDING_TYPE,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
};

const defaultsForA: SharedDirectFundingState = {
  fundingType: states.DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
};

describe('start in UNKNOWN_FUNDING_TYPE', () => {
  describe('incoming action: FUNDING_REQUESTED', () => {
    // player A scenario
    const state = states.waitForFundingRequest(defaultsForUnknown);
    const action = actions.fundingRequested();
    const updatedState = fundingStateReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });

  describe('incoming action: FUNDING_REQUESTED', () => {
    // player B scenario
    const state = states.waitForFundingRequest(defaultsForUnknown);
    const action = actions.fundingRequested();
    const updatedState = fundingStateReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });
});

describe('start in DIRECT_FUNDING_TYPE', () => {
  const state = states.waitForFundingRequest(defaultsForA);
  const action = actions.fundingRequested();

  const updatedState = fundingStateReducer(state, action);
  // TODO: Mock the delegation
  itTransitionsToStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
});
