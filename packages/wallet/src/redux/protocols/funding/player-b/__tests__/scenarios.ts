import * as states from '../states';
import * as actions from '../actions';
import { EMPTY_SHARED_DATA } from '../../../../state';
import { PlayerIndex } from '../../../../types';

// To test all paths through the state machine we will use 4 different scenarios:
//
// 1. Happy path: WaitForStrategyProposal
//             -> WaitForStrategyApproval
//             -> WaitForFunding
//             -> WaitForPostFundSetup
//             -> WaitForSuccessConfirmation
//             -> Success
//
// 2. WaitForStrategyApproval --> |StrategyRejected| WaitForStrategyProposal
//
// 3. WaitForStrategyProposal --> |Cancelled| Failure
// 4. WaitForStrategyApproval --> |Cancelled| Failure

// ---------
// Test data
// ---------
const processId = 'process-id.123';
const sharedData = EMPTY_SHARED_DATA;

const props = { processId, sharedData, fundingState: 'funding state' as 'funding state' };

// ------
// States
// ------
const waitForStrategyProposal = states.waitForStrategyProposal(props);
const waitForStrategyApproval = states.waitForStrategyApproval(props);
const waitForFunding = states.waitForFunding(props);
const waitForPostFundSetup = states.waitForPostFundSetup(props);
const waitForSuccessConfirmation = states.waitForSuccessConfirmation(props);
const success = states.success();
const failure = states.failure('User refused');
const failure2 = states.failure('Opponent refused');

// -------
// Actions
// -------
const strategyProposed = actions.strategyProposed(processId);
const strategyApproved = actions.strategyApproved(processId);
const strategyRejected = actions.strategyRejected(processId);
const cancelled = actions.cancelled(processId, PlayerIndex.B);
const cancelledByOpponent = actions.cancelled(processId, PlayerIndex.A);

// ---------
// Scenarios
// ---------
export const happyPath = {
  ...props,
  // States
  waitForStrategyProposal,
  waitForStrategyApproval,
  waitForFunding,
  waitForPostFundSetup,
  waitForSuccessConfirmation,
  success,
  // Actions
  strategyProposed,
  strategyApproved,
};

export const rejectedStrategy = {
  ...props,
  // States
  waitForStrategyProposal,
  waitForStrategyApproval,
  // Actions
  strategyRejected,
};

export const cancelledByA = {
  ...props,
  // States
  waitForStrategyApproval,
  failure,
  // Actions
  cancelled,
};

export const cancelledByB = {
  ...props,
  // States
  waitForStrategyProposal,
  failure2,
  // Actions
  cancelledByOpponent,
};
