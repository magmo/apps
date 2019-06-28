import { Wallet } from 'ethers';
import * as web3Utils from 'web3-utils';
import * as testScenarios from '../../../__tests__/test-scenarios';
import { ChannelState, ChannelStore } from '../../../channel-store';
import { EMPTY_SHARED_DATA, SharedData } from '../../../state';
import * as transactionScenarios from '../../transaction-submission/__tests__';
import * as transactionActions from '../../transaction-submission/actions';
import * as actions from '../actions';
import * as states from '../states';

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

const channelStatus: ChannelState = {
  address,
  privateKey,
  channelId,
  libraryAddress,
  ourIndex: 0,
  participants,
  channelNonce,
  turnNum: concludeCommitment2.turnNum,
  funded: true,
  commitments: [
    { commitment: concludeCommitment1, signature: '0x0' },
    { commitment: concludeCommitment2, signature: '0x0' },
  ],
};

const channelStore: ChannelStore = {
  [channelId]: channelStatus,
};

const notClosedChannelStatus: ChannelState = {
  ...channelStatus,
  commitments: [
    { commitment: gameCommitment1, signature: '0x0' },
    { commitment: gameCommitment2, signature: '0x0' },
  ],
  turnNum: gameCommitment2.turnNum,
};

const notClosedChannelState = {
  [channelId]: notClosedChannelStatus,
};

const transaction = {};
const withdrawalAddress = Wallet.createRandom().address;
const processId = 'process-id.123';
const sharedData: SharedData = { ...EMPTY_SHARED_DATA, channelStore };
const withdrawalAmount = web3Utils.toWei('5');
const transactionSubmissionState = transactionScenarios.preSuccessState;
const props = {
  transaction,
  processId,
  sharedData,
  withdrawalAmount,
  transactionSubmissionState,
  channelId,
  withdrawalAddress,
};

// ------
// States
// ------
const waitForApproval = states.waitForApproval(props);
const waitForTransaction = states.waitForTransaction(props);
const waitForAcknowledgement = states.waitForAcknowledgement(props);
const success = states.success({});
const transactionFailure = states.failure({ reason: states.FailureReason.TransactionFailure });
const userRejectedFailure = states.failure({ reason: states.FailureReason.UserRejected });
const channelNotClosedFailure = states.failure({ reason: states.FailureReason.ChannelNotClosed });

// -------
// Actions
// -------

const approved = actions.withdrawalApproved({ processId, withdrawalAddress });
const rejected = actions.withdrawalRejected({ processId });
const successAcknowledged = actions.withdrawalSuccessAcknowledged({ processId });
const transactionConfirmed = transactionActions.transactionConfirmed({ processId });
const transactionFailed = transactionActions.transactionFailed({ processId });

// ---------
// Scenarios
// ---------
export const happyPath = {
  ...props,
  waitForApproval: {
    state: waitForApproval,
    action: approved,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionConfirmed,
  },
  waitForAcknowledgement: {
    state: waitForAcknowledgement,
    action: successAcknowledged,
  },
  success,
};

export const withdrawalRejected = {
  ...props,
  waitForApproval: {
    state: waitForApproval,
    action: rejected,
  },
  failure: userRejectedFailure,
};

export const failedTransaction = {
  ...props,
  waitForApproval: {
    state: waitForApproval,
    action: approved,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionFailed,
  },
  failure: transactionFailure,
};

export const channelNotClosed = {
  ...props,
  sharedData: { ...EMPTY_SHARED_DATA, channelStore: notClosedChannelState },
  failure: channelNotClosedFailure,
};
