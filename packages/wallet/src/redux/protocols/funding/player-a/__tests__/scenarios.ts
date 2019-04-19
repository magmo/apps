import * as states from '../states';
import * as actions from '../actions';
import { EMPTY_SHARED_DATA } from '../../../../state';
import { PlayerIndex } from '../../../../types';

// To test all paths through the state machine we will use 4 different scenarios:
//
// 1. Happy path: WaitForStrategyChoice
//             -> WaitForStrategyResponse
//             -> WaitForFunding
//             -> WaitForPostFundSetup
//             -> WaitForSuccessConfirmation
//             -> Success
//
// 2. WaitForStrategyResponse --> |StrategyRejected| WaitForStrategyChoice
//
// 3. WaitForStrategyChoice   --> |Cancelled| Failure
// 4. WaitForStrategyResponse --> |Cancelled| Failure

// ---------
// Test data
// ---------
const processId = 'process-id.123';
const sharedData = EMPTY_SHARED_DATA;

const props = { processId, sharedData, fundingState: 'funding state' as 'funding state' };

// ----
// States
// ------
const waitForStrategyChoice = states.waitForStrategyChoice(props);
const waitForStrategyResponse = states.waitForStrategyResponse(props);
const waitForFunding = states.waitForFunding(props);
const waitForPostFundSetup = states.waitForPostFundSetup(props);
const waitForSuccessConfirmation = states.waitForSuccessConfirmation(props);
const success = states.success();
const failure = states.failure('User refused');
const failure2 = states.failure('Opponent refused');

// -------
// Actions
// -------
const strategyChosen = actions.strategyChosen(processId);
const strategyApproved = actions.strategyApproved(processId);
const strategyRejected = actions.strategyRejected(processId);
const cancelled = actions.cancelled(processId, PlayerIndex.A);
const cancelledByOpponent = actions.cancelled(processId, PlayerIndex.B);

// ---------
// Scenarios
// ---------
export const happyPath = {
  ...props,
  // States
  waitForStrategyChoice,
  waitForStrategyResponse,
  waitForFunding,
  waitForPostFundSetup,
  waitForSuccessConfirmation,
  success,
  // Actions
  strategyChosen,
  strategyApproved,
};

export const rejectedStrategy = {
  ...props,
  // States
  waitForStrategyResponse,
  waitForStrategyChoice,
  // Actions
  strategyRejected,
};

export const cancelledByA = {
  ...props,
  // States
  waitForStrategyResponse,
  failure,
  // Actions
  cancelled,
};

export const cancelledByB = {
  ...props,
  // States
  waitForStrategyChoice,
  failure2,
  // Actions
  cancelledByOpponent,
};
