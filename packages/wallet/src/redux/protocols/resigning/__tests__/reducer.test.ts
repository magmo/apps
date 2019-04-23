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
    const state = scenario.approveResignation;
    const action = scenario.concludeSent;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'WaitForOpponentConclude');
    // it initializes the transaction state machine
  });

  describe('when in WaitForOpponentConclude', () => {
    const state = scenario.waitForOpponentConclude;
    const action = scenario.concludeReceived;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'AcknowledgeChannelClosed');
  });

  describe('when in AcknowledgeChannelClosed', () => {
    const state = scenario.acknowledgeChannelClosed;
    const action = scenario.defundChosen;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'WaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const state = scenario.waitForDefund;
    const action = scenario.defunded;
    const result = resigningReducer(state, storage, action);

    itTransitionsTo(result, 'Success');
  });
});

function itTransitionsTo(result: ReturnVal, type: ResigningStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}
