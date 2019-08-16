import { ConcludingStateType } from '../states';
import * as scenarios from './scenarios';
import { initialize } from '..';
import {
  describeScenarioStep,
  itSendsThisDisplayEventType,
  itRelaysThisAction,
} from '../../../__tests__/helpers';
import { concludingReducer } from '../reducer';
import { concludeInstigated } from '../../../../communication';
import { SHOW_WALLET, HIDE_WALLET } from 'magmo-wallet-client';

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
    itRelaysThisAction(
      result.sharedData,
      concludeInstigated({ channelId: scenario.initialize.channelId }),
    );
    itSendsThisDisplayEventType(result.sharedData, SHOW_WALLET);
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
    itSendsThisDisplayEventType(result.sharedData, HIDE_WALLET);
  });
});

function itTransitionsTo(result, type: ConcludingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}
