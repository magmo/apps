import * as states from '../state';
import * as actions from '../actions';
import * as testScenarios from '../../../../__tests__/test-scenarios';
import * as transactionScenarios from '../../../transaction-submission/__tests__';
import { EMPTY_SHARED_DATA, SharedData } from '../../../../state';

import { ChannelState, ChannelStore } from '../../../../channel-store';
import * as transactionActions from '../../../transaction-submission/actions';
import { challengeExpiredEvent } from '../../../../actions';
import {
  preSuccessState as defundingPreSuccessState,
  successTrigger as defundingSuccessTrigger,
  preFailureState as defundingPreFailureState,
  failureTrigger as defundingFailureTrigger,
} from '../../../defunding/__tests__';

// ---------
// Test data
// ---------

const {
  bsAddress: address,
  bsPrivateKey: privateKey,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  gameCommitment1,
  gameCommitment2,
  gameCommitment3,
} = testScenarios;

const channelStatus: ChannelState = {
  address,
  privateKey,
  channelId,
  libraryAddress,
  ourIndex: 1,
  participants,
  channelNonce,
  funded: true,
  lastCommitment: { commitment: gameCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: gameCommitment1, signature: '0x0' },
  turnNum: gameCommitment2.turnNum,
};

const channelStore: ChannelStore = {
  [channelId]: channelStatus,
};

const refuteChannelStatus = {
  ...channelStatus,
  lastCommitment: { commitment: gameCommitment3, signature: '0x0' },
  penultimateCommitment: { commitment: gameCommitment2, signature: '0x0' },
  turnNum: gameCommitment2.turnNum,
};
const refuteChannelState = {
  [channelId]: refuteChannelStatus,
};
const transactionSubmissionState = transactionScenarios.preSuccessState;
const processId = 'process-id.123';
const sharedData: SharedData = { ...EMPTY_SHARED_DATA, channelStore };
const props = { processId, transactionSubmissionState, sharedData, channelId };

// ------
// States
// ------
const waitForApprovalRefute = states.waitForApproval({
  ...props,
  challengeCommitment: gameCommitment1,
});
const waitForApprovalRespond = states.waitForApproval({
  ...props,
  challengeCommitment: gameCommitment1,
});
const waitForApprovalRequiresResponse = states.waitForApproval({
  ...props,
  challengeCommitment: gameCommitment3,
});
const waitForTransaction = states.waitForTransaction(props);
const waitForAcknowledgement = states.waitForAcknowledgement(props);
const waitForResponse = states.waitForResponse(props);
const success = states.success();
const transactionFailedFailure = states.failure(states.FailureReason.TransactionFailure);
const transactionConfirmed = transactionActions.transactionConfirmed(processId);
const transactionFailed = transactionActions.transactionFailed(processId);
const acknowledgeTimeout = states.acknowledgeTimeout(props);
const waitForDefund1 = states.waitForDefund({
  ...props,
  defundingState: defundingPreSuccessState,
});
const waitForDefund2 = states.waitForDefund({
  ...props,
  defundingState: defundingPreFailureState,
});
const acknowledgeDefundingSuccess = states.acknowledgeDefundingSuccess({ ...props });
const acknowledgeClosedButNotDefunded = states.acknowledgeClosedButNotDefunded({ ...props });
// ------
// Actions
// ------
const approve = actions.respondApproved(processId);
const acknowledge = actions.respondSuccessAcknowledged(processId);
const responseProvided = actions.responseProvided(processId, testScenarios.gameCommitment3);
const defundChosen = actions.defundChosen(processId);
const acknowledged = actions.acknowledged(processId);
const challengeTimedOut = challengeExpiredEvent(processId, channelId, 1000);

// ---------
// Scenarios
// ---------
export const respondWithExistingCommitmentHappyPath = {
  ...props,
  challengeCommitment: gameCommitment1,
  responseCommitment: gameCommitment2,
  // States
  waitForApproval: waitForApprovalRespond,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  transactionConfirmed,
  acknowledge,
};

export const refuteHappyPath = {
  ...props,
  sharedData: { ...props.sharedData, channelStore: refuteChannelState },
  challengeCommitment: gameCommitment1,
  refuteCommitment: gameCommitment3,
  // States
  waitForApproval: waitForApprovalRefute,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  transactionConfirmed,
  acknowledge,
};

export const requireResponseHappyPath = {
  ...props,
  challengeCommitment: gameCommitment2,
  responseCommitment: gameCommitment3,
  // States
  waitForApproval: waitForApprovalRequiresResponse,
  waitForResponse,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  responseProvided,
  transactionConfirmed,
  acknowledge,
};

export const transactionFails = {
  ...props,
  // States
  waitForApproval: waitForApprovalRespond,
  waitForTransaction,
  failure: transactionFailedFailure,
  // Actions
  approve,
  transactionFailed,
};

export const challengeExpiresChannelDefunded = {
  ...props,
  // States
  waitForResponse,
  acknowledgeTimeout,
  waitForDefund1,
  acknowledgeDefundingSuccess,
  // Actions
  challengeTimedOut,
  defundChosen,
  defundingSuccessTrigger,
  acknowledged,
};

export const challengeExpiresButChannelNotDefunded = {
  ...props,
  // States
  waitForDefund2,
  acknowledgeClosedButNotDefunded,
  // Actions
  defundingFailureTrigger,
  acknowledged,
};

export const challengeExpiresDuringWaitForTransaction = {
  ...props,
  waitForTransaction,
  challengeTimedOut,
};

export const challengeExpiresDuringWaitForApproval = {
  ...props,
  waitForApproval: waitForApprovalRespond,
  challengeTimedOut,
};

export const defundActionComesDuringAcknowledgeTimeout = {
  ...props,
  acknowledgeTimeout,

  defundingSuccessTrigger,
};
