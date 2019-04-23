import * as scenarios from './scenarios';
import { resigningReducer, initialize, ReturnVal } from '../reducer';
import { ResigningStateType } from '../states';

describe('happy path scenario', () => {
  const scenario = scenarios.happyPath;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'ApproveResignation');
  });
  describe('when in ApproveResignation', () => {
    const state = scenario.states.approveResignation;
    const action = scenario.actions.concludeSent;
    const result = resigningReducer(state, storage, action);
    // TODO check that the conclude has actually been sent
    itTransitionsTo(result, 'WaitForOpponentConclude');
  });

  describe('when in WaitForOpponentConclude', () => {
    const state = scenario.states.waitForOpponentConclude;
    const action = scenario.actions.concludeReceived;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'AcknowledgeChannelClosed');
  });

  describe('when in AcknowledgeChannelClosed', () => {
    const state = scenario.states.acknowledgeChannelClosed;
    const action = scenario.actions.defundChosen;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'WaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const state = scenario.states.waitForDefund;
    const action = scenario.actions.defunded;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'Success');
  });
});

function itTransitionsTo(result: ReturnVal, type: ResigningStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}
