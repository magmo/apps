import * as states from '../states';
import * as actions from '../actions';
import * as tsScenarios from '../../transaction-submission/__tests__/scenarios';

// To test all paths through the state machine we will use 5 different scenarios:
//
// 1. Opponent responds
//      WaitForApproval -> WaitForTransaction -> WaitForResponseOrTimeout
//        -> AcknowledgeResponse -> Open
// 2. Challenge times out: WaitForResponseOrTimeout -> AcknowledgeTimeout -> Closed
// 3. Challenge unnecessary: WaitForApproval -> AcknowledgeUnnecessary -> Unnecessary
// 4. User denies challenge: WaitForApproval -> AcknowledgeFailure -> Failure
// 5. Tranaction fails: WaitForTransaction -> AcknowledgeFailure -> Failure

// --------
// Defaults
// --------
const processId = 'processId';
const channelId = 'channelId';
const tsPreSuccess = tsScenarios.happyPath.waitForConfirmation;
const tsPreFailure = tsScenarios.transactionFailed.waitForConfirmation;
const defaults = { processId, channelId };

// ------
// States
// ------
const waitForApproval = states.waitForApproval(defaults);
const waitForTransactionSuccess = states.waitForTransaction({
  ...defaults,
  transactionSubmission: tsPreSuccess,
});
const waitForTransactionFailure = states.waitForTransaction({
  ...defaults,
  transactionSubmission: tsPreFailure,
});
const waitForResponseOrTimeout = states.waitForResponseOrTimeout(defaults);
const acknowledgeTimeout = states.acknowledgeTimeout(defaults);
const acknowledgeResponse = states.acknowledgeResponse(defaults);
const acknowledgeUnnecessary = states.acknowledgeUnnecessary(defaults);
const acknowledgeFailure = states.acknowledgeFailure(defaults);
const successOpen = states.successOpen();
const successClosed = states.successClosed();
const unnecessary = states.unnecessary();
const failure = states.failure();

// -------
// Actions
// -------
const challengeApproved = actions.challengeApproved(processId);
const challengeDenied = actions.challengeDenied(processId);
const transactionSuccessTrigger = tsScenarios.happyPath.confirmed;
const transactionFailureTrigger = tsScenarios.transactionFailed.failed;
const responseReceived = actions.challengeResponseReceived(processId);
const responseAcknowledged = actions.challengeResponseAcknowledged(processId);
const timeoutAcknowledged = actions.challengeTimeoutAcknowledged(processId);
const acknowledgedUnnecessary = actions.acknowledgedChallengeUnnecessary(processId);
const failureAcknowledged = actions.challengeFailureAcknowledged(processId);

// -------
// Scenarios
// -------
export const opponentResponds = {
  ...defaults,
  // states
  waitForApproval,
  waitForTransaction: waitForTransactionSuccess,
  waitForResponseOrTimeout,
  acknowledgeResponse,
  successOpen,
  // actions
  challengeApproved,
  transactionSuccessTrigger,
  responseReceived,
  responseAcknowledged,
};

// Todo: need to figure out how a `ChallengeTimedOut` action should be triggered
export const challengeTimesOut = {
  ...defaults,
  // states
  waitForResponseOrTimeout,
  acknowledgeTimeout,
  successClosed,
  // actions
  // todo: action to trigger timeout
  timeoutAcknowledged,
};

export const challengeUnnecessary = {
  ...defaults,
  // states
  waitForApproval,
  acknowledgeUnnecessary,
  unnecessary,
  // actions
  challengeApproved,
  acknowledgedUnnecessary,
};

export const userDeniesChallenge = {
  ...defaults,
  // states
  waitForApproval,
  acknowledgeFailure,
  failure,
  // actions
  challengeDenied,
  failureAcknowledged,
};

export const transactionFails = {
  ...defaults,
  // states
  waitForTransaction: waitForTransactionFailure,
  acknowledgeFailure,
  failure,
  // actions
  transactionFailureTrigger,
  failureAcknowledged,
};
