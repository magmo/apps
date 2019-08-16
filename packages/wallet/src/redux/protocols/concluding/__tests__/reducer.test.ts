import { ConcludingStateType } from '../states';
import * as scenarios from './scenarios';
import { initialize } from '..';
import { describeScenarioStep } from '../../../__tests__/helpers';
import { concludingReducer } from '../reducer';

describe('Opponent Concluded Happy Path', () => {
  const scenario = scenarios.opponentConcludedHappyPath;

  describe('when initializing', () => {
    const result = initialize(scenario.initialize);
    itTransitionsTo(result, 'Concluding.WaitForConclude');
    // TODO: Verify no conclude instigated sent
  });

  describeScenarioStep(scenario.waitForConclude, () => {
    const { action, state, sharedData } = scenario.waitForConclude;
    const result = concludingReducer(state, sharedData, action);
    itTransitionsTo(result, 'Concluding.WaitForDefund');
  });

  describeScenarioStep(scenario.waitForDefund, () => {
    const { action, state, sharedData } = scenario.waitForDefund;
    const result = concludingReducer(state, sharedData, action);
    itTransitionsTo(result, 'Concluding.Success');
  });
});

describe('Player Concluded Happy Path', () => {
  const scenario = scenarios.playerConcludedHappyPath;

  describe('when initializing', () => {
    const result = initialize(scenario.initialize);
    itTransitionsTo(result, 'Concluding.WaitForConclude');
    // TODO: Verify conclude instigated sent first
  });

  describeScenarioStep(scenario.waitForConclude, () => {
    const { action, state, sharedData } = scenario.waitForConclude;
    const result = concludingReducer(state, sharedData, action);
    itTransitionsTo(result, 'Concluding.WaitForDefund');
  });

  describeScenarioStep(scenario.waitForDefund, () => {
    const { action, state, sharedData } = scenario.waitForDefund;
    const result = concludingReducer(state, sharedData, action);
    itTransitionsTo(result, 'Concluding.Success');
  });
});

function itTransitionsTo(result, type: ConcludingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}
