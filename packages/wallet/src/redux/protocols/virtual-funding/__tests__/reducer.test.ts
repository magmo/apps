import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import { describeScenarioStep } from '../../../__tests__/helpers';
import { success, preSuccess } from '../../advance-channel/__tests__';

const itTransitionsTo = (
  result: states.VirtualFundingState,
  type: states.VirtualFundingStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};

const itTransitionsSubstateTo = (
  result: any,
  substate: states.SubstateDescriptor,
  type: string,
) => {
  it(`transitions to ${type}`, () => {
    expect(result[substate].type).toEqual(type);
  });
};

describe('happyPath', () => {
  const scenario = scenarios.happyPath;

  describeScenarioStep(scenario.initialize, () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForChannelPreparation');
  });

  describeScenarioStep(scenario.openGFirst, () => {
    const { state, sharedData, action } = scenario.openGFirst;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForChannelPreparation');
    itTransitionsSubstateTo(protocolState, 'guarantorChannel', success.state.type);
    itTransitionsSubstateTo(protocolState, 'jointChannel', preSuccess.state.type);
  });

  describeScenarioStep(scenario.openJFirst, () => {
    const { state, sharedData, action } = scenario.openJFirst;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForChannelPreparation');
    itTransitionsSubstateTo(protocolState, 'jointChannel', success.state.type);
    itTransitionsSubstateTo(protocolState, 'guarantorChannel', preSuccess.state.type);
  });

  describeScenarioStep(scenario.openGSecond, () => {
    const { state, sharedData, action } = scenario.openGSecond;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorFunding');
    itTransitionsSubstateTo(protocolState, 'indirectGuarantorFunding', 'NotImplemented');
  });

  describeScenarioStep(scenario.openJSecond, () => {
    const { state, sharedData, action } = scenario.openJSecond;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorFunding');
    itTransitionsSubstateTo(protocolState, 'indirectGuarantorFunding', 'NotImplemented');
  });
});
