import * as states from '../states';
import * as actions from '../actions';
import * as transactionActions from '../../transaction-submission/actions';
import { SharedData } from '../..';
import * as transactionScenarios from '../../transaction-submission/__tests__/scenarios';
import {
  ChannelStatus,
  RUNNING,
  WAIT_FOR_UPDATE,
  ChannelState,
} from '../../../channel-state/state';
import * as testScenarios from '../../../__tests__/test-scenarios';
import { EMPTY_OUTBOX_STATE } from '../../../outbox/state';

// To test all paths through the state machine we will use 4 different scenarios:
//
// 1. Happy path: WaitForApproval -> WaitForTransaction -> WaitForAcknowledgement -> Success
// 2. Withdrawal Rejected: WaitForApproval -> Failure
// 3. Transaction failure: WaitForApproval -> WaitForTransaction -> Failure
// 4. Channel not closed failure: WitForApproval -> Failure

// ---------
// Test data
// ---------

const {
  asAddress: address,
  asPrivateKey: privateKey,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  concludeCommitment1,
  concludeCommitment2,
  gameCommitment1,
  gameCommitment2,
} = testScenarios;

const channelStatus: ChannelStatus = {
  address,
  privateKey,
  stage: RUNNING,
  type: WAIT_FOR_UPDATE,
  channelId,
  libraryAddress,
  ourIndex: 0,
  participants,
  channelNonce,
  turnNum: concludeCommitment2.turnNum,
  funded: true,
  lastCommitment: { commitment: concludeCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: concludeCommitment1, signature: '0x0' },
};

const channelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: channelStatus,
  },
};

const notClosedChannelStatus = {
  ...channelStatus,
  lastCommitment: { commitment: gameCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: gameCommitment1, signature: '0x0' },
  turnNum: gameCommitment2.turnNum,
};

const notClosedChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: notClosedChannelStatus,
  },
};

const transaction = {};
const processId = 'process-id.123';
const sharedData: SharedData = { outboxState: EMPTY_OUTBOX_STATE, channelState };
const withdrawalAmount = '0x05';
const transactionSubmissionState = transactionScenarios.happyPath.waitForSubmission;
const props = { transaction, processId, sharedData, withdrawalAmount, transactionSubmissionState };

// ------
// States
// ------
const waitForApproval = states.waitForApproval(props);
const waitForTransaction = states.waitForTransaction(props);
const waitForAcknowledgement = states.waitForAcknowledgement(props);
const success = states.success();
const transactionFailure = states.failure('User refused');
const userRejectedFailure = states.failure('Transaction failed');
const channelNotClosedFailure = states.failure('Channel not closed');

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

export const channelNotClosed = {
  ...props,
  sharedData: { channelState: notClosedChannelState, outboxState: EMPTY_OUTBOX_STATE },
  // States
  waitForApproval,
  channelNotClosedFailure,
  // Actions
  approved,
};
