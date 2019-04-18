import * as scenarios from './scenarios';
import { initialize, respondingReducer } from '../reducer';

import * as states from '../state';
import { Commitment } from 'fmg-core/lib/commitment';
import * as TransactionGenerator from '../../../../utils/transaction-generator';

// Mocks
const mockTransaction = { to: '0xabc' };
const createRespondWithMoveMock = jest.fn().mockReturnValue(mockTransaction);
Object.defineProperty(TransactionGenerator, 'createRespondWithMoveTransaction', {
  value: createRespondWithMoveMock,
});

describe('respond with existing move happy-path scenario', () => {
  const scenario = scenarios.respondWithExistingCommitmentHappyPath;
  const { sharedData, processId } = scenario;

  describe('when initializing', () => {
    const { challengeCommitment } = scenario;
    const result = initialize(challengeCommitment, processId, sharedData);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
    itSetsChallengeCommitment(result, scenario.challengeCommitment);
  });

  describe(`when in ${states.WAIT_FOR_APPROVAL}`, () => {
    const state = scenario.waitForApproval;
    const action = scenario.approve;

    const result = respondingReducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itCallsRespondWithMoveWith(scenario.challengeCommitment);
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

const itCallsRespondWithMoveWith = (challengeCommitment: Commitment) => {
  it('calls respond with move with the correct commitment', () => {
    expect(createRespondWithMoveMock).toHaveBeenCalledWith(
      challengeCommitment,
      jasmine.any(Object),
    );
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
