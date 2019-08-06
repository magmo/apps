import * as scenarios from './scenarios';
import { initialize, reducer } from '../reducer';
import * as states from '../states';
import { scenarioStepDescription } from '../../../__tests__/helpers';
const itTransitionsTo = (
  result: states.VirtualDefundingState,
  type: states.VirtualDefundingStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};
describe('happyPath', () => {
  const scenario = scenarios.happyPath;

  describe('Initialization', () => {
    const result = initialize(scenario.initialize);

    itTransitionsTo(result.protocolState, 'VirtualDefunding.WaitForJointChannelUpdate');
  });

  describe(scenarioStepDescription(scenario.waitForJointChannel), () => {
    const { sharedData, state, action } = scenario.waitForJointChannel;
    const result = reducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'VirtualDefunding.WaitForLedgerChannelUpdate');
  });

  describe(scenarioStepDescription(scenario.waitForLedgerChannel), () => {
    const { sharedData, state, action } = scenario.waitForLedgerChannel;
    const result = reducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'VirtualDefunding.Success');
  });
});
