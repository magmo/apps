import * as scenarios from './scenarios';
import { initialize, responderReducer } from '../reducer';

import * as states from '../states';
import { Commitment } from '../../../../../domain';
import * as TransactionGenerator from '../../../../../utils/transaction-generator';
import { SHOW_WALLET, HIDE_WALLET, CHALLENGE_COMPLETE } from 'magmo-wallet-client';
import { itSendsThisDisplayEventType, itSendsThisMessage } from '../../../../__tests__/helpers';

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
  result: { protocolState: states.ResponderState },
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

const itTransitionsTo = (
  result: { protocolState: states.ResponderState },
  type: states.ResponderStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

const itSetsChallengeCommitment = (
  result: { protocolState: states.ResponderState },
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

    itTransitionsTo(result, 'Responding.WaitForApproval');
    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in Responding.WaitForApproval`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = responderReducer(state, sharedData, action);

    itTransitionsTo(result, 'Responding.WaitForTransaction');
    itCallsRespondWithMoveWith(scenario.responseCommitment);
  });

  describe(`when in Responding.WaitForTransaction`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
  });

  describe(`when in Responding.WaitForAcknowledgement`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.Success');
  });
});

describe('REFUTE HAPPY-PATH ', () => {
  const scenario = scenarios.refuteHappyPath;
  const { sharedData, processId, channelId } = scenario;

  describe('when initializing', () => {
    const { challengeCommitment } = scenario;
    const result = initialize(processId, channelId, sharedData, challengeCommitment);

    itTransitionsTo(result, 'Responding.WaitForApproval');
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in Responding.WaitForApproval`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = responderReducer(state, sharedData, action);

    itTransitionsTo(result, 'Responding.WaitForTransaction');
    itCallsRefuteWith(scenario.refuteCommitment);
  });

  describe(`when in Responding.WaitForTransaction`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
  });

  describe(`when in Responding.WaitForAcknowledgement`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.Success');
  });
});

describe('SELECT RESPONSE HAPPY-PATH ', () => {
  const scenario = scenarios.requireResponseHappyPath;
  const { sharedData, processId, channelId } = scenario;

  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData, scenario.challengeCommitment);

    itTransitionsTo(result, 'Responding.WaitForApproval');
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in Responding.WaitForApproval`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = responderReducer(state, sharedData, action);

    itTransitionsTo(result, 'Responding.WaitForResponse');
    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
  });

  describe(`when in Responding.WaitForResponse`, () => {
    const state = scenario.waitForResponse;
    const action = scenario.responseProvided;

    const result = responderReducer(state, sharedData, action);

    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
    itTransitionsTo(result, 'Responding.WaitForTransaction');
    itCallsRespondWithMoveWith(scenario.responseCommitment);
  });

  describe(`when in Responding.WaitForTransaction`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionConfirmed;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForAcknowledgement');
  });

  describe(`when in Responding.WaitForAcknowledgement`, () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.acknowledge;

    const result = responderReducer(state, sharedData, action);

    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
    itSendsThisMessage(result.sharedData, CHALLENGE_COMPLETE);
    itTransitionsTo(result, 'Responding.Success');
  });
});

describe('TRANSACTION FAILED ', () => {
  const scenario = scenarios.transactionFails;
  const { sharedData } = scenario;

  describe(`when in Responding.WaitForTransaction`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionFailed;

    const result = responderReducer(state, sharedData, action);
    itTransitionsToFailure(result, scenario.failure);
  });
});

describe('CHALLENGE EXPIRES --> DEFUNDED', () => {
  const scenario = scenarios.challengeExpiresChannelDefunded;
  const { sharedData } = scenario;

  describe(`when in Responding.WaitForResponse`, () => {
    const state = scenario.waitForResponse;
    const action = scenario.challengeTimedOut;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
  });

  describe(`when in Responding.AcknowledgeTimeout`, () => {
    const state = scenario.acknowledgeTimeout;
    const action = scenario.defundChosen;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.WaitForDefund');
  });

  describe(`when in Responding.WaitForDefund`, () => {
    const state = scenario.waitForDefund1;
    const action = scenario.defundingSuccessTrigger;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.AcknowledgeDefundingSuccess');
  });

  describe(`when in Responding.AcknowledgeDefundingSuccess`, () => {
    const state = scenario.acknowledgeDefundingSuccess;
    const action = scenario.acknowledged;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.ClosedAndDefunded');
  });
});

describe('CHALLENGE EXPIRES --> not DEFUNDED', () => {
  const scenario = scenarios.challengeExpiresButChannelNotDefunded;
  const { sharedData } = scenario;

  describe(`when in Responding.WaitForDefund`, () => {
    const state = scenario.waitForDefund2;
    const action = scenario.defundingFailureTrigger;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.AcknowledgeClosedButNotDefunded');
  });

  describe(`when in Responding.AcknowledgeClosedButNotDefunded`, () => {
    const state = scenario.acknowledgeClosedButNotDefunded;
    const action = scenario.acknowledged;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.ClosedButNotDefunded');
  });
});

describe('CHALLENGE EXPIRES when in WaitForTransaction', () => {
  const scenario = scenarios.challengeExpiresDuringWaitForTransaction;
  const { sharedData } = scenario;
  describe(`when in Responding.WaitForTransaction`, () => {
    const state = scenario.waitForTransaction;
    const action = scenario.challengeTimedOut;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
  });
});

describe('CHALLENGE EXPIRES when in WaitForApproval', () => {
  const scenario = scenarios.challengeExpiresDuringWaitForApproval;
  const { sharedData } = scenario;
  describe(`when in Responding.WaitForApproval`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.challengeTimedOut;

    const result = responderReducer(state, sharedData, action);
    itTransitionsTo(result, 'Responding.AcknowledgeTimeout');
  });
});

describe('DEFUND ACTION arrives in ACKNOWLEDGE_TIMEOUT', () => {
  const scenario = scenarios.defundActionComesDuringAcknowledgeTimeout;
  const { sharedData } = scenario;
  describe(`when in Responding.AcknowledgeTimeout`, () => {
    const state = scenario.acknowledgeTimeout;
    const action = scenario.defundingSuccessTrigger;

    const result = responderReducer(state, sharedData, action);
    // TODO: Is this the correct state?
    itTransitionsTo(result, 'Responding.AcknowledgeClosedButNotDefunded');
  });
});
