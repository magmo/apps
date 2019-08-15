import * as scenarios from './scenarios';
import { describeScenarioStep, itSendsThisDisplayEventType } from '../../../__tests__/helpers';
import { closeChannelReducer, initialize } from '../reducer';
import { HIDE_WALLET } from 'magmo-wallet-client';
import * as states from '../states';

const itTransitionsTo = (
  result: { protocolState: states.CloseChannelState },
  type: states.CloseChannelStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

describe('happy path', () => {
  const scenario = scenarios.happyPath;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'CloseChannel.WaitForConclude');
  });
  describeScenarioStep(scenario.waitForConclude, () => {
    const { state, action, sharedData } = scenario.waitForConclude;
    const result = closeChannelReducer(state, sharedData, action);

    itTransitionsTo(result, 'CloseChannel.WaitForWithdrawal');
  });

  describeScenarioStep(scenario.waitForWithdrawal, () => {
    const { state, action, sharedData } = scenario.waitForWithdrawal;
    const result = closeChannelReducer(state, sharedData, action);

    itTransitionsTo(result, 'CloseChannel.Success');
    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
  });
});

describe('channel already concluded', () => {
  const scenario = scenarios.alreadyConcluded;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'CloseChannel.WaitForWithdrawal');
  });
  describeScenarioStep(scenario.waitForWithdrawal, () => {
    const { state, action, sharedData } = scenario.waitForWithdrawal;
    const result = closeChannelReducer(state, sharedData, action);

    itTransitionsTo(result, 'CloseChannel.Success');
    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
  });
});

describe('channel in use failure', () => {
  const scenario = scenarios.channelInUseFailure;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'CloseChannel.Failure');
  });
});
