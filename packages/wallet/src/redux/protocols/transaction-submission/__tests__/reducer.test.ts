import * as scenarios from './scenarios';
import { transactionReducer as reducer, initialize, ReturnVal } from '../reducer';

describe('happy path scenario', () => {
  const scenario = scenarios.happyPath;
  const storage = scenario.sharedData;

  describe('when initializing', () => {
    const { transaction, processId } = scenario;
    const result = initialize(transaction, processId, storage);

    itTransitionsTo(result, 'WaitForSend');
    // it keeps the processId
    // it sets a requestId
    // it queues a transaction
  });

  describe('when in WaitForSend', () => {
    const state = scenario.waitForSend;
    const action = scenario.sent;
    const result = reducer(state, storage, action);

    itTransitionsTo(result, 'WaitForSubmission');
  });

  describe('when in WaitForSubmission', () => {
    const state = scenario.waitForSubmission;
    const action = scenario.submitted;
    const result = reducer(state, storage, action);

    itTransitionsTo(result, 'WaitForConfirmation');
  });

  describe('when in WaitForConfirmation', () => {
    const state = scenario.waitForConfirmation;
    const action = scenario.confirmed;
    const result = reducer(state, storage, action);

    itTransitionsTo(result, 'Success');
  });
});

function itTransitionsTo(result: ReturnVal, type: string) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}
