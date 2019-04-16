import * as scenarios from './scenarios';
import { withdrawalReducer as reducer, initialize } from '../reducer';
import * as states from '../states';
import { itSendsThisTransaction } from '../../../__tests__/helpers';
import * as TransactionGenerator from '../../../../utils/transaction-generator';
import { mockTransactionOutboxItem } from '../../../__tests__/test-scenarios';

// Mocks
const createConcludeAndWithdrawMock = jest.fn().mockReturnValue(mockTransactionOutboxItem);
Object.defineProperty(TransactionGenerator, 'createConcludeAndWithdrawTransaction', {
  value: createConcludeAndWithdrawMock,
});

describe('happy-path scenario', () => {
  const scenario = scenarios.happyPath;
  const { sharedData } = scenario;

  describe('when initializing', () => {
    const { processId, withdrawalAmount } = scenario;
    const result = initialize(withdrawalAmount, processId, sharedData);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
  });

  describe(whenIn(states.WAIT_FOR_APPROVAL), () => {
    const state = scenario.waitForApproval;
    const action = scenario.approved;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itSendsThisTransaction(result, mockTransactionOutboxItem);
  });

  describe(whenIn(states.WAIT_FOR_TRANSACTION), () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionSent;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_ACKNOWLEDGEMENT);
  });

  describe(whenIn(states.WAIT_FOR_TRANSACTION), () => {
    const state = scenario.waitForAcknowledgement;
    const action = scenario.successAcknowledged;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.SUCCESS);
  });
});

describe('withdrawal rejected scenario', () => {
  const scenario = scenarios.withdrawalRejected;
  const { sharedData } = scenario;

  describe(whenIn(states.WAIT_FOR_APPROVAL), () => {
    const state = scenario.waitForApproval;
    const action = scenario.rejected;
    const result = reducer(state, sharedData, action);

    itFailsWithReason(result, scenario.userRejectedFailure.reason);
  });
});

describe('transaction failed scenario', () => {
  const scenario = scenarios.failedTransaction;
  const storage = scenario.sharedData;

  describe(whenIn(states.WAIT_FOR_TRANSACTION), () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionFailed;
    const result = reducer(state, storage, action);
    itFailsWithReason(result, scenario.transactionFailure.reason);
  });
});

const whenIn = stage => `when in ${stage}`;

const itFailsWithReason = (result: { protocolState: states.WithdrawalState }, reason) => {
  itTransitionsTo(result, states.FAILURE);
  it(`fails with ${reason}`, () => {
    expect((result.protocolState as states.Failure).reason).toEqual(reason);
  });
};
const itTransitionsTo = (result: { protocolState: states.WithdrawalState }, type: string) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};
