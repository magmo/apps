import * as scenarios from './scenarios';
import { concludingReducer, initialize, ReturnVal } from '../reducer';
import { ConcludingStateType } from '../states';

describe('happy path scenario', () => {
  const scenario = scenarios.happyPath;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'ApproveConcluding');
  });
  describe('when in ApproveConcluding', () => {
    const state = scenario.states.approveConcluding;
    const action = scenario.actions.concludeSent;
    const result = concludingReducer(state, storage, action);
    // TODO check that the conclude has actually been sent
    itTransitionsTo(result, 'WaitForOpponentConclude');
  });

  describe('when in WaitForOpponentConclude', () => {
    const state = scenario.states.waitForOpponentConclude;
    const action = scenario.actions.concludeReceived;
    const result = concludingReducer(state, storage, action);

    itTransitionsTo(result, 'AcknowledgeChannelConcluded');
  });

  describe('when in AcknowledgeChannelConcluded', () => {
    const state = scenario.states.acknowledgeChannelConcluded;
    const action = scenario.actions.defundChosen;
    const result = concludingReducer(state, storage, action);

    itTransitionsTo(result, 'WaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const state = scenario.states.waitForDefund;
    const action = scenario.actions.defunded;
    const result = concludingReducer(state, storage, action);

    itTransitionsTo(result, 'Success');
  });
});

function itTransitionsTo(result: ReturnVal, type: ConcludingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}
