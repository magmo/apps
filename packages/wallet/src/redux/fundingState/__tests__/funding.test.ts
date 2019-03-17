import { fundingStateReducer } from '../reducer';

import * as states from '../state';
import * as directFundingStates from '../directFunding/state';
import * as actions from '../../actions';

import * as scenarios from '../../__tests__/test-scenarios';
import { itChangesChannelFundingStatusTo } from '../../__tests__/helpers';
import { SharedUnknownFundingState } from '../shared/state';
import { addHex } from '../../../utils/hex-utils';

const { channelId, twoThree } = scenarios;

const YOUR_DEPOSIT_A = twoThree[0];
const YOUR_DEPOSIT_B = twoThree[1];
const TOTAL_REQUIRED = twoThree.reduce(addHex);

const defaultsForUnknown: SharedUnknownFundingState = {
  fundingType: states.UNKNOWN_FUNDING_TYPE,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  channelFundingStatus: '',
};

const defaultsForA: directFundingStates.DirectFundingState = {
  fundingType: states.DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  safeToDepositLevel: '0x',
  channelFundingStatus: directFundingStates.WAIT_FOR_FUNDING_APPROVAL,
};

describe('start in UNKNOWN_FUNDING_TYPE', () => {
  describe('incoming action: FUNDING_REQUESTED', () => {
    // player A scenario
    const state = states.waitForFundingRequest(defaultsForUnknown);
    const action = actions.internal.directFundingRequested(
      channelId,
      '0x',
      TOTAL_REQUIRED,
      YOUR_DEPOSIT_A,
    );
    const updatedState = fundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });

  describe('incoming action: FUNDING_REQUESTED', () => {
    // player B scenario
    const state = states.waitForFundingRequest(defaultsForUnknown);
    const action = actions.internal.directFundingRequested(
      channelId,
      YOUR_DEPOSIT_A,
      TOTAL_REQUIRED,
      YOUR_DEPOSIT_B,
    );
    const updatedState = fundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
  });
});

describe('start in DIRECT_FUNDING_TYPE', () => {
  const state = states.waitForFundingApproval(defaultsForA);
  const action = actions.fundingApproved();

  const updatedState = fundingStateReducer(state, action);
  // TODO: Mock the delegation
  itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, updatedState);
});
