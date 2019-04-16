import * as states from '../states';
import * as actions from '../actions';
import * as transactionActions from '../../transaction-submission/actions';
import { EMPTY_SHARED_DATA } from '../..';
import * as transactionScenarios from '../../transaction-submission/__tests__/scenarios';

// To test all paths through the state machine we will use 3 different scenarios:
//
// 1. Happy path: WaitForApproval -> WaitForTransaction -> WaitForAcknowledgement -> Success
// 2. Withdrawal Rejected: WaitForApproval -> Rejected
// 3. Transaction failure: WaitForApproval -> WaitForTransaction -> Failure
// ---------
// Test data
// ---------
const transaction = {};
const processId = 'process-id.123';
const sharedData = EMPTY_SHARED_DATA;
const withdrawalAmount = '0x05';
const transactionSubmissionState = transactionScenarios.happyPath.waitForSubmission;
const props = { transaction, processId, sharedData, withdrawalAmount, transactionSubmissionState };

// ------
// States
// ------
const waitForApproval = states.waitforApproval(props);
const waitForTransaction = states.waitForTransaction(props);
const waitForAcknowledgement = states.waitForAcknowledgement(props);
const success = states.success();
const transactionFailure = states.failure('User refused');
const userRejectedFailure = states.failure('Transaction failed');

// -------
// Actions
// -------

const approved = actions.withdrawalApproved(processId);
const rejected = actions.withdrawalRejected(processId);
const successAcknowledged = actions.withdrawalSuccessAcknowledged(processId);
const transactionSent = transactionActions.transactionSent(processId);
const transactionFailed = transactionActions.transactionFailed(processId);

// ---------
// Scenarios
// ---------
export const happyPath = {
  ...props,
  // States
  waitForApproval,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approved,
  transactionSent,
  successAcknowledged,
};

export const withdrawalRejected = {
  ...props,
  // States
  waitForApproval,
  userRejectedFailure,
  // Actions
  rejected,
};

export const failedTransaction = {
  ...props,
  // States
  waitForApproval,
  waitForTransaction,
  transactionFailure,
  // Actions
  approved,
  transactionFailed,
};
