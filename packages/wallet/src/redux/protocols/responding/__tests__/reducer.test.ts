import * as scenarios from './scenarios';
import { initialize, respondingReducer } from '../reducer';

import * as states from '../state';
import { Commitment } from '../../../../domain';
import * as TransactionGenerator from '../../../../utils/transaction-generator';
import { SHOW_WALLET, HIDE_WALLET, CHALLENGE_COMPLETE } from 'magmo-wallet-client';
import { itSendsThisDisplayEventType, itSendsThisMessage } from '../../../__tests__/helpers';

// Mocks
const mockTransaction = { to: '0xabc' };
const createRespondWithMoveMock = jest.fn().mockReturnValue(mockTransaction);
const refuteMock = jest.fn().mockReturnValue(mockTransaction);
Object.defineProperty(TransactionGenerator, 'createRespondWithMoveTransaction', {
  value: createRespondWithMoveMock,
});
Object.defineProperty(TransactionGenerator, 'createRefuteTransaction', {
  value: refuteMock,
});

// helpers
const itTransitionsToFailure = (
  result: { protocolState: states.RespondingState },
  failure: states.Failure,
) => {
  it(`transitions to failure with reason ${failure.reason}`, () => {
    expect(result.protocolState).toMatchObject(failure);
  });
};

const itCallsRespondWithMoveWith = (challengeCommitment: Commitment) => {
  it('calls respond with move with the correct commitment', () => {
    expect(createRespondWithMoveMock).toHaveBeenCalledWith(
      challengeCommitment,
      jasmine.any(String),
    );
  });
};

const itCallsRefuteWith = (refuteCommitment: Commitment) => {
  it('calls refute with the correct commitment', () => {
    expect(refuteMock).toHaveBeenCalledWith(refuteCommitment, jasmine.any(String));
  });
};

const itTransitionsTo = (result: { protocolState: states.RespondingState }, type: string) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

const itSetsChallengeCommitment = (
  result: { protocolState: states.RespondingState },
  commitment: Commitment,
) => {
  it('sets the correct challenge commitment', () => {
    expect((result.protocolState as states.WaitForApproval).challengeCommitment).toMatchObject(
      commitment,
    );
  });
};

describe('RESPOND WITH EXISTING MOVE HAPPY-PATH', () => {
  const scenario = scenarios.respondWithExistingCommitmentHappyPath;
  const { sharedData, processId, channelId } = scenario;

  describe('when initializing', () => {
    const { challengeCommitment } = scenario;
    const result = initialize(processId, channelId, sharedData, challengeCommitment);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in ${states.WAIT_FOR_APPROVAL}`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = respondingReducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itCallsRespondWithMoveWith(scenario.responseCommitment);
  });

  describe(`when in ${states.WAIT_FOR_TRANSACTION}`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.WAIT_FOR_ACKNOWLEDGEMENT);
  });

  describe(`when in ${states.WAIT_FOR_ACKNOWLEDGEMENT}`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('REFUTE HAPPY-PATH ', () => {
  const scenario = scenarios.refuteHappyPath;
  const { sharedData, processId, channelId } = scenario;

  describe('when initializing', () => {
    const { challengeCommitment } = scenario;
    const result = initialize(processId, channelId, sharedData, challengeCommitment);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in ${states.WAIT_FOR_APPROVAL}`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = respondingReducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itCallsRefuteWith(scenario.refuteCommitment);
  });

  describe(`when in ${states.WAIT_FOR_TRANSACTION}`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.WAIT_FOR_ACKNOWLEDGEMENT);
  });

  describe(`when in ${states.WAIT_FOR_ACKNOWLEDGEMENT}`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('SELECT RESPONSE HAPPY-PATH ', () => {
  const scenario = scenarios.requireResponseHappyPath;
  const { sharedData, processId, channelId } = scenario;

  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData, scenario.challengeCommitment);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in ${states.WAIT_FOR_APPROVAL}`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = respondingReducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_RESPONSE);
    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
  });

  describe(`when in ${states.WAIT_FOR_RESPONSE}`, () => {
    const state = scenario.waitForResponse;
    const action = scenario.responseProvided;

    const result = respondingReducer(state, sharedData, action);

    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itCallsRespondWithMoveWith(scenario.responseCommitment);
  });

  describe(`when in ${states.WAIT_FOR_TRANSACTION}`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.WAIT_FOR_ACKNOWLEDGEMENT);
  });

  describe(`when in ${states.WAIT_FOR_ACKNOWLEDGEMENT}`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = respondingReducer(state, sharedData, action);

    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
    itSendsThisMessage(result.sharedData, CHALLENGE_COMPLETE);
    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('TRANSACTION FAILED ', () => {
  const scenario = scenarios.transactionFails;
  const { sharedData } = scenario;

  describe(`when in ${states.WAIT_FOR_TRANSACTION}`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionFailed;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsToFailure(result, scenario.failure);
  });
});

describe('CHALLENGE EXPIRES --> DEFUNDED', () => {
  const scenario = scenarios.challengeExpiresChannelDefunded;
  const { sharedData } = scenario;

  describe(`when in ${states.WAIT_FOR_RESPONSE}`, () => {
    const state = scenario.waitForResponse;
    const action = scenario.challengeTimedOut;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.ACKNOWLEDGE_TIMEOUT);
  });

  describe(`when in ${states.ACKNOWLEDGE_TIMEOUT}`, () => {
    const state = scenario.acknowledgeTimeout;
    const action = scenario.defundChosen;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.WAIT_FOR_DEFUND);
  });

  describe(`when in ${states.WAIT_FOR_DEFUND}`, () => {
    const state = scenario.waitForDefund1;
    const action = scenario.defundingSuccessTrigger;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.ACKNOWLEDGE_DEFUNDING_SUCCESS);
  });

  describe(`when in ${states.ACKNOWLEDGE_DEFUNDING_SUCCESS}`, () => {
    const state = scenario.acknowledgeDefundingSuccess;
    const action = scenario.acknowledged;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.CLOSED_AND_DEFUNDED);
  });
});

describe('CHALLENGE EXPIRES --> not DEFUNDED', () => {
  const scenario = scenarios.challengeExpiresButChannelNotDefunded;
  const { sharedData } = scenario;

  describe(`when in ${states.WAIT_FOR_DEFUND}`, () => {
    const state = scenario.waitForDefund2;
    const action = scenario.defundingFailureTrigger;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.ACKNOWLEDGE_CLOSED_BUT_NOT_DEFUNDED);
  });

  describe(`when in ${states.ACKNOWLEDGE_CLOSED_BUT_NOT_DEFUNDED}`, () => {
    const state = scenario.acknowledgeClosedButNotDefunded;
    const action = scenario.acknowledged;

    const result = respondingReducer(state, sharedData, action);
    itTransitionsTo(result, states.CLOSED_BUT_NOT_DEFUNDED);
  });
});
