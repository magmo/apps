import * as scenarios from './scenarios';
import { challengingReducer, initialize, ReturnVal } from '../reducer';
import { FailureReason, ChallengingStateType } from '../states';
import {
  itSendsThisMessage,
  itSendsThisDisplayEventType,
  itStoresThisCommitment,
} from '../../../__tests__/helpers';
import {
  HIDE_WALLET,
  CHALLENGE_COMPLETE,
  CHALLENGE_COMMITMENT_RECEIVED,
  SHOW_WALLET,
} from 'magmo-wallet-client';

describe('opponent-responds scenario', () => {
  const scenario = scenarios.opponentResponds;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);
    itSendsThisDisplayEventType(result.storage, SHOW_WALLET);

    itTransitionsTo(result, 'Challenging.ApproveChallenge');
  });
  describe('when in ApproveChallenge', () => {
    const state = scenario.approveChallenge;
    const action = scenario.challengeApproved;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.WaitForTransaction');
    // it initializes the transaction state machine
  });

  describe('when in WaitForTransaction', () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionSuccessTrigger;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.WaitForResponseOrTimeout');
  });

  describe('when in WaitForResponseOrTimeout', () => {
    const state = scenario.waitForResponseOrTimeout;
    const action = scenario.responseReceived;
    const result = challengingReducer(state, storage, action);

    itSendsThisMessage(result.storage, CHALLENGE_COMMITMENT_RECEIVED);
    itStoresThisCommitment(result.storage, scenario.challengeCommitment);
    itTransitionsTo(result, 'Challenging.AcknowledgeResponse');
  });

  describe('when in AcknowledgeResponse', () => {
    const state = scenario.acknowledgeResponse;
    const action = scenario.responseAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.SuccessOpen');
    itSendsThisMessage(result.storage, CHALLENGE_COMPLETE);
    itSendsThisDisplayEventType(result.storage, HIDE_WALLET);
  });
});

describe('challenge-times-out scenario', () => {
  const scenario = scenarios.challengeTimesOut;
  const { storage } = scenario;

  describe('when in WaitForResponseOrTimeout', () => {
    const state = scenario.waitForResponseOrTimeout;
    const action = scenario.challengeTimedOut;
    const result = challengingReducer(state, storage, action);
    itTransitionsTo(result, 'Challenging.AcknowledgeTimeout');
  });

  describe('when in AcknowledgeTimeout', () => {
    const state = scenario.acknowledgeTimeout;
    const action = scenario.timeoutAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.SuccessClosed');
  });
});

describe("channel-doesn't-exist scenario", () => {
  const scenario = scenarios.channelDoesntExist;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });
});

describe('channel-not-fully-open scenario', () => {
  const scenario = scenarios.channelNotFullyOpen;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'NotFullyOpen');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'NotFullyOpen');
  });
});

describe('already-have-latest-commitment scenario', () => {
  const scenario = scenarios.alreadyHaveLatest;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'AlreadyHaveLatest');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'AlreadyHaveLatest');
  });
});

describe('user-declines-challenge scenario', () => {
  const scenario = scenarios.userDeclinesChallenge;
  const { storage } = scenario;

  describe('when in ApproveChallenge', () => {
    const state = scenario.approveChallenge;
    const action = scenario.challengeDenied;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'DeclinedByUser');
  });
  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'DeclinedByUser');
  });
});

describe('receive-commitment-while-approving scenario', () => {
  const scenario = scenarios.receiveCommitmentWhileApproving;
  const { storage } = scenario;

  describe('when in ApproveChallenge', () => {
    const state = scenario.approveChallenge;
    // note: we're triggering this off the user's acceptance, not the arrival of the update
    const action = scenario.challengeApproved;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'LatestWhileApproving');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'LatestWhileApproving');
  });
});

describe('transaction-fails scenario', () => {
  const scenario = scenarios.transactionFails;
  const { storage } = scenario;

  describe('when in WaitForTransaction', () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionFailureTrigger;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'TransactionFailed');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'TransactionFailed');
  });
});

function itTransitionsTo(result: ReturnVal, type: ChallengingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}

function itHasFailureReason(result: ReturnVal, reason: FailureReason) {
  it(`has failure reason ${reason}`, () => {
    if ('reason' in result.state) {
      expect(result.state.reason).toEqual(reason);
    } else {
      fail(`State ${result.state.type} doesn't have a failure reason.`);
    }
  });
}
