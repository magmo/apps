import * as states from '../states';
import * as actions from '../actions';

import * as transactionScenarios from '../../../transaction-submission/__tests__';
import { EMPTY_SHARED_DATA, SharedData } from '../../../../state';

import { ChannelState, ChannelStore } from '../../../../channel-store';
import * as transactionActions from '../../../transaction-submission/actions';
import { challengeExpiredEvent } from '../../../../actions';
import * as testScenarios from '../../../../../domain/commitments/__tests__';
// ---------
// Test data
// ---------

const { channelId, participants } = testScenarios;
const gameState1 = testScenarios.appState({ turnNum: 19 });
const gameState2 = testScenarios.appState({ turnNum: 20 });
const gameState3 = testScenarios.appState({ turnNum: 21 });

const channelStatus: ChannelState = {
  channel: { participants, chainId: '0x1', channelNonce: '0x1' },
  type: 'Channel.WaitForState',
  signedStates: [gameState1, gameState2],
  turnNumRecord: gameState2.state.turnNum,
};

const channelStore: ChannelStore = {
  [channelId]: channelStatus,
};

const refuteChannelStatus: ChannelState = {
  ...channelStatus,
  signedStates: [gameState2, gameState3],
  turnNumRecord: gameState2.state.turnNum,
};
const refuteChannelState = {
  [channelId]: refuteChannelStatus,
};
const transactionSubmissionState = transactionScenarios.preSuccessState;
const processId = 'process-id.123';
const sharedData: SharedData = { ...EMPTY_SHARED_DATA, channelStore };
const defaults = { processId, transactionSubmissionState, sharedData, channelId, expiryTime: 0 };

// ------
// States
// ------
const waitForApprovalRefute = states.waitForApproval({
  ...defaults,
  challengeState: gameState1,
});
const waitForApprovalRespond = states.waitForApproval({
  ...defaults,
  challengeState: gameState1,
});
const waitForApprovalRequiresResponse = states.waitForApproval({
  ...defaults,
  challengeState: gameState3,
});
const waitForTransaction = states.waitForTransaction(defaults);
const waitForAcknowledgement = states.waitForAcknowledgement(defaults);
const waitForResponse = states.waitForResponse(defaults);
const transactionFailedFailure = states.failure({
  reason: states.FailureReason.TransactionFailure,
});
const transactionConfirmed = transactionActions.transactionConfirmed({ processId });
const transactionFailed = transactionActions.transactionFailed({ processId });
const acknowledgeTimeout = states.acknowledgeTimeout(defaults);

// ------
// Actions
// ------
const approve = actions.respondApproved({ processId });
const responseProvided = actions.responseProvided({
  processId,
  signedState: gameState3,
});
const acknowledged = actions.acknowledged({ processId });
const challengeTimedOut = challengeExpiredEvent({
  processId,
  protocolLocator: [],
  channelId,
  timestamp: 1000,
});

// ---------
// Scenarios
// ---------
export const respondWithExistingCommitmentHappyPath = {
  ...defaults,
  challengeCommitment: gameState1,
  waitForApproval: {
    state: waitForApprovalRespond,
    action: approve,
    responseCommitment: gameState2,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionConfirmed,
  },
  waitForAcknowledgement: {
    state: waitForAcknowledgement,
    action: acknowledged,
  },
};

export const refuteHappyPath = {
  ...defaults,
  sharedData: { ...defaults.sharedData, channelStore: refuteChannelState },
  challengeCommitment: gameState1,
  waitForApproval: {
    state: waitForApprovalRefute,
    action: approve,
    refuteCommitment: gameState3,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionConfirmed,
  },
  waitForAcknowledgement: {
    state: waitForAcknowledgement,
    action: acknowledged,
  },
};

export const requireResponseHappyPath = {
  ...defaults,
  challengeCommitment: gameState2,
  waitForApprovalRequiresResponse: {
    state: waitForApprovalRequiresResponse,
    action: approve,
  },
  waitForResponse: {
    state: waitForResponse,
    action: responseProvided,
    responseCommitment: gameState3,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionConfirmed,
  },
  waitForAcknowledgement: {
    state: waitForAcknowledgement,
    action: acknowledged,
  },
};

export const transactionFails = {
  ...defaults,
  waitForApproval: {
    state: waitForApprovalRespond,
    action: approve,
  },
  waitForTransaction: {
    state: waitForTransaction,
    action: transactionFailed,
  },
  failure: transactionFailedFailure,
};

export const challengeExpires = {
  ...defaults,
  waitForResponse: {
    state: waitForResponse,
    action: challengeTimedOut,
  },
  acknowledgeTimeout: {
    state: acknowledgeTimeout,
    action: acknowledged,
  },
};

export const challengeExpiresAndDefund = {
  ...defaults,
  defund: {
    state: acknowledgeTimeout,
    action: actions.exitChallenge({ ...defaults }),
  },
};

export const challengeExpiresDuringWaitForTransaction = {
  ...defaults,
  waitForTransaction: {
    state: waitForTransaction,
    action: challengeTimedOut,
  },
};

export const challengeExpiresDuringWaitForApproval = {
  ...defaults,
  waitForApprovalRespond: {
    state: waitForApprovalRespond,
    action: challengeTimedOut,
  },
};
