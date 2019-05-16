import * as scenarios from './scenarios';
import { challengingReducer, initialize, ReturnVal } from '../reducer';
import {
  FailureReason,
  ChallengingStateType,
  WaitForTransaction,
  WaitForResponseOrTimeout,
} from '../states';
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

describe('OPPONENT RESPONDS', () => {
  const scenario = scenarios.opponentResponds;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);
    itSendsThisDisplayEventType(result.storage, SHOW_WALLET);

    itTransitionsTo(result, 'Challenging.ApproveChallenge');
  });
  describe('when in ApproveChallenge', () => {
    const { state, action } = scenario.approveChallenge;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.WaitForTransaction');
    // it initializes the transaction state machine
  });
  describe('when in WaitForTransaction', () => {
    const { state, action2 } = scenario.waitForTransaction;
    const result = challengingReducer(state, storage, action2);

    itTransitionsTo(result, 'Challenging.WaitForTransaction');
    it('updates the expiry time', () => {
      expect((result.state as WaitForTransaction).expiryTime).toEqual(action2.expiryTime);
    });
  });
  describe('when in WaitForTransaction', () => {
    const { state, action } = scenario.waitForTransaction;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.WaitForResponseOrTimeout');
  });

  describe('when in WaitForResponseOrTimeout', () => {
    const { state, action1 } = scenario.waitForResponseOrTimeout;
    const result = challengingReducer(state, storage, action1);

    itTransitionsTo(result, 'Challenging.WaitForResponseOrTimeout');
    it('updates the expiry time', () => {
      expect((result.state as WaitForResponseOrTimeout).expiryTime).toEqual(action1.expiryTime);
    });
  });
  describe('when in WaitForResponseOrTimeout', () => {
    const { state, action2, commitment } = scenario.waitForResponseOrTimeout;
    const result = challengingReducer(state, storage, action2);

    itSendsThisMessage(result.storage, CHALLENGE_COMMITMENT_RECEIVED);
    itStoresThisCommitment(result.storage, commitment);
    itTransitionsTo(result, 'Challenging.AcknowledgeResponse');
  });

  describe('when in AcknowledgeResponse', () => {
    const { state, action } = scenario.acknowledgeResponse;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.SuccessOpen');
    itSendsThisMessage(result.storage, CHALLENGE_COMPLETE);
    itSendsThisDisplayEventType(result.storage, HIDE_WALLET);
  });
});

describe('CHALLENGE TIMES OUT AND IS DEFUNDED ', () => {
  const scenario = scenarios.challengeTimesOutAndIsDefunded;
  const { storage } = scenario;

  describe('when in WaitForResponseOrTimeout', () => {
    const { state, action } = scenario.waitForResponseOrTimeout;
    const result = challengingReducer(state, storage, action);
    itTransitionsTo(result, 'Challenging.AcknowledgeTimeout');
  });

  describe('when in AcknowledgeTimeout', () => {
    const { state, action } = scenario.acknowledgeTimeout;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.WaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const { state, action } = scenario.challengerWaitForDefund;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeSuccess');
  });

  describe('when in Acknowledge Success', () => {
    const { state, action } = scenario.acknowledgeSuccess;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.SuccessClosed');
  });
});

describe('CHALLENGE TIMES OUT AND IS not DEFUNDED ', () => {
  const scenario = scenarios.challengeTimesOutAndIsNotDefunded;
  const { storage } = scenario;

  describe('when in WaitForDefund', () => {
    const { state, action } = scenario.challengerWaitForDefund;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeSuccess');
  });

  describe('when in Acknowledge Success', () => {
    const { state, action } = scenario.acknowledgeClosedButNotDefunded;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.SuccessClosed');
  });
});

describe('CHANNEL DOESNT EXIST  ', () => {
  const scenario = scenarios.channelDoesntExist;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });
});

describe('CHANNEL NOT FULLY OPEN  ', () => {
  const scenario = scenarios.channelNotFullyOpen;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'NotFullyOpen');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'NotFullyOpen');
  });
});

describe('ALREADY HAVE LATEST COMMITMENT', () => {
  const scenario = scenarios.alreadyHaveLatest;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'AlreadyHaveLatest');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'AlreadyHaveLatest');
  });
});

describe('USER DECLINES CHALLENGE  ', () => {
  const scenario = scenarios.userDeclinesChallenge;
  const { storage } = scenario;

  describe('when in ApproveChallenge', () => {
    const { state, action } = scenario.approveChallenge;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'DeclinedByUser');
  });
  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'DeclinedByUser');
  });
});

describe('RECEIVE COMMITMENT WHILE APPROVING  ', () => {
  const scenario = scenarios.receiveCommitmentWhileApproving;
  const { storage } = scenario;

  describe('when in ApproveChallenge', () => {
    const { state, action } = scenario.approveChallenge;
    // note: we're triggering this off the user's acceptance, not the arrival of the update
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'LatestWhileApproving');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;

    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.Failure');
    itHasFailureReason(result, 'LatestWhileApproving');
  });
});

describe('TRANSACTION FAILS  ', () => {
  const scenario = scenarios.transactionFails;
  const { storage } = scenario;

  describe('when in WaitForTransaction', () => {
    const { state, action } = scenario.waitForTransaction;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Challenging.AcknowledgeFailure');
    itHasFailureReason(result, 'TransactionFailed');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action } = scenario.acknowledgeFailure;
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
