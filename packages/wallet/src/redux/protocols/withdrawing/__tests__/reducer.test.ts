import * as scenarios from './scenarios';
import { withdrawalReducer as reducer, initialize } from '../reducer';
import * as states from '../states';
import * as TransactionGenerator from '../../../../utils/transaction-generator';

import { SharedData } from '../..';

// Mocks
const mockTransaction = { to: '0xabc' };
const createConcludeAndWithdrawMock = jest.fn().mockReturnValue(mockTransaction);
Object.defineProperty(TransactionGenerator, 'createConcludeAndWithdrawTransaction', {
  value: createConcludeAndWithdrawMock,
});

// Helpers
const whenIn = stage => `when in ${stage}`;

const itTransitionsToFailure = (
  result: { protocolState: states.WithdrawalState },
  failure: states.Failure,
) => {
  it(`transitions to failure with reason ${failure.reason}`, () => {
    expect(result.protocolState).toMatchObject(failure);
  });
};
const itTransitionsTo = (result: { protocolState: states.WithdrawalState }, type: string) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};
const itSendsConcludeAndWithdrawTransaction = (result: { sharedData: SharedData }) => {
  it('sends the conclude and withdraw transaction', () => {
    // TODO: This is painful :()
    expect(result.sharedData.outboxState.transactionOutbox[0]).toMatchObject({
      transactionRequest: mockTransaction,
    });
  });
};

// Scenario tests
describe('happy-path scenario', () => {
  const scenario = scenarios.happyPath;
  const { sharedData } = scenario;

  describe('when initializing', () => {
    const { processId, withdrawalAmount, channelId } = scenario;
    const result = initialize(withdrawalAmount, channelId, processId, sharedData);

    itTransitionsTo(result, states.WAIT_FOR_APPROVAL);
  });

  describe(whenIn(states.WAIT_FOR_APPROVAL), () => {
    const state = scenario.waitForApproval;
    const action = scenario.approved;
    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, states.WAIT_FOR_TRANSACTION);
    itSendsConcludeAndWithdrawTransaction(result);
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

    itTransitionsToFailure(result, scenario.userRejectedFailure);
  });
});

describe('transaction failed scenario', () => {
  const scenario = scenarios.failedTransaction;
  const { sharedData } = scenario;

  describe(whenIn(states.WAIT_FOR_TRANSACTION), () => {
    const state = scenario.waitForTransaction;
    const action = scenario.transactionFailed;
    const result = reducer(state, sharedData, action);
    itTransitionsToFailure(result, scenario.transactionFailure);
  });
});

describe('channel not closed scenario', () => {
  const scenario = scenarios.channelNotClosed;
  const { sharedData } = scenario;

  describe(whenIn(states.WAIT_FOR_APPROVAL), () => {
    const state = scenario.waitForApproval;
    const action = scenario.approved;
    const result = reducer(state, sharedData, action);
    itTransitionsToFailure(result, scenario.channelNotClosedFailure);
  });
});
