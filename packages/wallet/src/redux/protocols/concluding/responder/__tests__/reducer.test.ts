import * as scenarios from './scenarios';
import { responderConcludingReducer, initialize, ReturnVal } from '../reducer';
import { ResponderConcludingStateType } from '../states';
import { expectThisCommitmentSent } from '../../../../__tests__/helpers';

describe('[ Happy path ]', () => {
  const scenario = scenarios.happyPath;
  const { processId } = scenario;

  describe('when initializing', () => {
    const { commitment, store } = scenario.initialize;
    const result = initialize(commitment, processId, store);

    itTransitionsTo(result, 'ResponderApproveConcluding');
  });
  describe('when in ApproveConcluding', () => {
    const { state, store, action, reply } = scenario.approveConcluding;
    const result = responderConcludingReducer(state, store, action);

    expectThisCommitmentSent(result.storage, reply);
    itTransitionsTo(result, 'ResponderDecideDefund');
  });

  describe('when in DecideDefund', () => {
    const { state, store, action } = scenario.decideDefund;
    const result = responderConcludingReducer(state, store, action);

    itTransitionsTo(result, 'ResponderWaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const { state, store, action } = scenario.waitForDefund;
    const result = responderConcludingReducer(state, store, action);

    itTransitionsTo(result, 'ResponderAcknowledgeSuccess');
  });

  describe('when in AcknowledgeSuccess', () => {
    const { state, store, action } = scenario.acknowledgeSuccess;
    const result = responderConcludingReducer(state, store, action);

    itTransitionsTo(result, 'Success');
  });
});

// TODO: Unhappy paths

function itTransitionsTo(result: ReturnVal, type: ResponderConcludingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}

// function itTransitionsToFailure(result: ReturnVal, reason: FailureReason) {
//   it(`transitions to Failure with reason ${reason}`, () => {
//     expect(result.state.type).toEqual('Failure');
//     if (result.state.type === 'Failure') {
//       expect(result.state.reason).toEqual(reason);
//     }
//   });
// }

// function itTransitionsToAcknowledgeFailure(result: ReturnVal, reason: FailureReason) {
//   it(`transitions to AcknowledgeFailure with reason ${reason}`, () => {
//     expect(result.state.type).toEqual('ResponderAcknowledgeFailure');
//     if (result.state.type === 'ResponderAcknowledgeFailure') {
//       expect(result.state.reason).toEqual(reason);
//     }
//   });
// }
