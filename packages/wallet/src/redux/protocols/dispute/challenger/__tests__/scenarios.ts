import * as states from '../states';
import * as actions from '../actions';
import * as tsScenarios from '../../../transaction-submission/__tests__';
import { EMPTY_SHARED_DATA } from '../../../../state';
import { ChannelState } from '../../../../channel-store';
import {
  challengeExpiredEvent,
  respondWithMoveEvent,
  challengeExpirySetEvent,
} from '../../../../actions';

import * as testScenarios from '../../../../../domain/commitments/__tests__';
type Reason = states.FailureReason;

// -----------------
// Channel Scenarios
// -----------------
const { channelId } = testScenarios;
const signedState0 = testScenarios.appState({ turnNum: 0 });
const signedState19 = testScenarios.appState({ turnNum: 19 });
const signedState20 = testScenarios.appState({ turnNum: 20 });
const signedState21 = testScenarios.appState({ turnNum: 21 });

const partiallyOpen = testScenarios.channelStateFromStates([signedState0]);
const theirTurn = testScenarios.channelStateFromStates([signedState19, signedState20]);
const ourTurn = testScenarios.channelStateFromStates([signedState20, signedState21]);

// --------
// Defaults
// --------
const processId = 'processId';
const tsPreSuccess = tsScenarios.preSuccessState;
const tsPreFailure = tsScenarios.preFailureState;
const sharedData = (channelState: ChannelState) =>
  testScenarios.setChannels(EMPTY_SHARED_DATA, [channelState]);

const defaults = { processId, channelId, sharedData: sharedData(theirTurn) };

// ------
// States
// ------
const approveChallenge = states.approveChallenge(defaults);
const waitForTransactionSuccess = states.waitForTransaction({
  ...defaults,
  transactionSubmission: tsPreSuccess,
});
const waitForTransactionFailure = states.waitForTransaction({
  ...defaults,
  transactionSubmission: tsPreFailure,
});
const waitForResponseOrTimeout = states.waitForResponseOrTimeout({ ...defaults, expiryTime: 0 });
export const acknowledgeTimeout = states.acknowledgeTimeout(defaults);
export const acknowledgeResponse = states.acknowledgeResponse(defaults);
const acknowledgeFailure = (reason: Reason) => states.acknowledgeFailure({ ...defaults, reason });

// -------
// Actions
// -------
const challengeApproved = actions.challengeApproved({ processId });
const challengeDenied = actions.challengeDenied({ processId });
const challengeTimedOut = challengeExpiredEvent({
  processId,
  protocolLocator: [],
  channelId,
  timestamp: 1000,
});
const transactionSuccessTrigger = tsScenarios.successTrigger;
const transactionFailureTrigger = tsScenarios.failureTrigger;
const responseReceived = respondWithMoveEvent({
  processId,
  protocolLocator: [],
  channelId,
  responseState: signedState21,
});
const challengeExpirySet = challengeExpirySetEvent({
  processId,
  protocolLocator: [],
  channelId,
  expiryTime: 1234,
});
export const acknowledged = actions.acknowledged({ processId });

// -------
// Scenarios
// -------
export const opponentResponds = {
  ...defaults,
  approveChallenge: {
    state: approveChallenge,
    action: challengeApproved,
  },
  waitForTransaction: {
    state: waitForTransactionSuccess,
    action: transactionSuccessTrigger,
    action2: challengeExpirySet,
  },
  waitForResponseOrTimeoutReceiveResponse: {
    state: waitForResponseOrTimeout,
    action: responseReceived,
    signedState: signedState21,
  },
  waitForResponseOrTimeoutExpirySet: {
    state: waitForResponseOrTimeout,
    action: challengeExpirySet,
    signedState: signedState21,
  },
  acknowledgeResponse: {
    state: acknowledgeResponse,
    action: acknowledged,
  },
};

export const challengeTimesOutAndIsDefunded = {
  ...defaults,
  waitForResponseOrTimeout: {
    state: waitForResponseOrTimeout,
    action: challengeTimedOut,
  },
  defund: {
    state: acknowledgeTimeout,
    action: actions.exitChallenge({ ...defaults }),
  },
};

export const challengeTimesOutAndIsNotDefunded = {
  ...defaults,
  acknowledgeTimeout: {
    state: acknowledgeTimeout,
    action: acknowledged,
  },
};

export const channelDoesntExist = {
  ...defaults,
  sharedData: EMPTY_SHARED_DATA,
  acknowledgeFailure: {
    state: acknowledgeFailure('ChannelDoesntExist'),
    action: acknowledged,
  },
};

export const channelNotFullyOpen = {
  ...defaults,
  sharedData: sharedData(partiallyOpen),
  acknowledgeFailure: {
    state: acknowledgeFailure('NotFullyOpen'),
    action: acknowledged,
  },
};

export const alreadyHaveLatest = {
  ...defaults,
  sharedData: sharedData(ourTurn),
  acknowledgeFailure: {
    state: acknowledgeFailure('AlreadyHaveLatest'),
    action: acknowledged,
  },
};

export const userDeclinesChallenge = {
  ...defaults,
  approveChallenge: {
    state: approveChallenge,
    action: challengeDenied,
  },
  acknowledgeFailure: {
    state: acknowledgeFailure('DeclinedByUser'),
    action: acknowledged,
  },
};

export const receiveCommitmentWhileApproving = {
  ...defaults,
  sharedData: sharedData(ourTurn),
  approveChallenge: {
    state: approveChallenge,
    action: challengeApproved,
  },
  acknowledgeFailure: {
    state: acknowledgeFailure('LatestWhileApproving'),
    action: acknowledged,
  },
};

export const transactionFails = {
  ...defaults,
  waitForTransaction: {
    state: waitForTransactionFailure,
    action: transactionFailureTrigger,
  },
  acknowledgeFailure: {
    state: acknowledgeFailure('TransactionFailed'),
    action: acknowledged,
  },
};
