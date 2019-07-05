import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import {
  scenarioStepDescription,
  itSendsTheseCommitments,
  itSendsNoMessage,
} from '../../../__tests__/helpers';
import { preFund, postFund } from '../../advance-channel/__tests__';
import { twoThreeFive } from '../../../__tests__/test-scenarios';

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
  const { hubAddress } = scenario;

  describe('Initialization', () => {
    const { startingDestination } = scenario;
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForJointChannel');
    itSendsTheseCommitments(result, [
      {
        commitment: {
          turnNum: 0,
          allocation: twoThreeFive,
          destination: [...startingDestination, hubAddress],
        },
      },
    ]);
  });

  describe(scenarioStepDescription(scenario.openJ), () => {
    const { state, sharedData, action } = scenario.openJ;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForJointChannel');
    itTransitionsSubstateTo(protocolState, 'jointChannel', preFund.preSuccess.state.type);
    // Even though there should only be two commitments in the guarantor channel round,
    // since we're using the preSuccess scenarios from advance-channel, which sets up a joint
    // 3-party channel, three get sent out.
    itSendsTheseCommitments(result, [
      { commitment: { turnNum: 1 } },
      { commitment: { turnNum: 2 } },
      { commitment: { turnNum: 3 } },
    ]);
  });

  describe(scenarioStepDescription(scenario.prepareJ), () => {
    const { state, sharedData, action } = scenario.prepareJ;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorChannel');
    itTransitionsSubstateTo(protocolState, 'guarantorChannel', postFund.preSuccess.state.type);
    itSendsTheseCommitments(result, [
      {
        commitment: {
          turnNum: 0,
          allocation: [],
          destination: ['jointChannelAddress', hubAddress],
        },
      },
    ]);
  });

  describe(scenarioStepDescription(scenario.openG), () => {
    const { state, sharedData, action } = scenario.openG;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorChannel');
    itTransitionsSubstateTo(protocolState, 'guarantorChannel', postFund.preSuccess.state.type);
    // Even though there should only be two commitments in the guarantor channel round,
    // since we're using the preSuccess scenarios from advance-channel, which sets up a joint
    // 3-party channel, three get sent out.
    itSendsTheseCommitments(result, [
      { commitment: { turnNum: 1 } },
      { commitment: { turnNum: 2 } },
      { commitment: { turnNum: 3 } },
    ]);
  });

  describe.skip(scenarioStepDescription(scenario.prepareG), () => {
    const { state, sharedData, action } = scenario.prepareG;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorFunding');
    itTransitionsSubstateTo(protocolState, 'indirectGuarantorFunding', postFund.success.state.type);
    itSendsNoMessage(result);
  });
});
