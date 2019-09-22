import * as states from '../states';
import * as actions from '../actions';
import * as transactionActions from '../../transaction-submission/actions';
import * as transactionScenarios from '../../transaction-submission/__tests__';
import { ChannelState, ChannelStore } from '../../../channel-store';

import { Wallet } from 'ethers';
import { SharedData } from '../../../state';
import * as web3Utils from 'web3-utils';
import * as testScenarios from '../../../../domain/commitments/__tests__';
import { splitSignature } from 'ethers/utils';
// ---------
// Test data
// ---------

const { channelId } = testScenarios;
const signature = splitSignature(`0x5e9b7a7bd77ac21372939d386342ae58081a33bf53479152c87c1e787c27d06b
       118d3eccff0ace49891e192049e16b5210047068384772ba1fdb33bbcba580391c`);
const gameState1 = testScenarios.appState({ turnNum: 19 }).state;
const gameState2 = testScenarios.appState({ turnNum: 20 }).state;
const concludeState1 = testScenarios.appState({ turnNum: 51, isFinal: true }).state;
const concludeState2 = testScenarios.appState({ turnNum: 52, isFinal: true }).state;

const channelStatus: ChannelState = {
  channel: concludeState2.channel,
  type: 'Channel.WaitForState',
  turnNumRecord: concludeState2.turnNum,

  signedStates: [{ state: concludeState1, signature }, { state: concludeState2, signature }],
};

const channelStore: ChannelStore = {
  [channelId]: channelStatus,
};

const notClosedChannelStatus: ChannelState = {
  ...channelStatus,
  signedStates: [{ state: gameState1, signature }, { state: gameState2, signature }],
  turnNumRecord: gameState2.turnNum,
};

const notClosedChannelState = {
  [channelId]: notClosedChannelStatus,
};

const transaction = {};
const withdrawalAddress = Wallet.createRandom().address;
const processId = 'process-id.123';
const sharedData: SharedData = { ...testScenarios.testEmptySharedData(), channelStore };
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
  sharedData: { ...testScenarios.testEmptySharedData(), channelStore: notClosedChannelState },
  failure: channelNotClosedFailure,
};
