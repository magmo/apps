import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import {
  scenarioStepDescription,
  itSendsTheseStates,
  itSendsNoMessage,
} from '../../../__tests__/helpers';
import { preFund, postFund } from '../../advance-channel/__tests__';
import { asAddress } from '../../../../domain/commitments/__tests__';

const itTransitionsTo = (
  result: states.VirtualFundingState,
  type: states.VirtualFundingStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};

const itTransitionsSubstateTo = (result: any, substate: string, type: string) => {
  it(`transitions ${substate} to ${type}`, () => {
    expect(result[substate].type).toEqual(type);
  });
};

describe('happyPath', () => {
  const scenario = scenarios.happyPath;
  const { hubAddress } = scenario;

  describe('Initialization', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(sharedData, args);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForJointChannel');
    itSendsTheseStates(result, [{ state: { turnNum: 0 } }]);
  });

  describe('openJ', () => {
    const { state, sharedData, action } = scenario.openJ;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForJointChannel');
    itTransitionsSubstateTo(protocolState, 'jointChannel', preFund.preSuccess.state.type);
    // Even though there should only be two commitments in the guarantor channel round,
    // since we're using the preSuccess scenarios from advance-channel, which sets up a joint
    // 3-party channel, three get sent out.
    // TODO: Fix this by constructing appropriate test data
    itSendsTheseStates(result, [
      { state: { turnNum: 1 } },
      { state: { turnNum: 2 } },
      { state: { turnNum: 3 } },
    ]);
  });

  describe(scenarioStepDescription(scenario.prepareJ), () => {
    const { state, sharedData, action } = scenario.prepareJ;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorChannel');
    itTransitionsSubstateTo(protocolState, 'guarantorChannel', postFund.preSuccess.state.type);
    itSendsTheseStates(result, [
      {
        state: {
          turnNum: 0,
          outcome: [], // TODO: Check for guarantor outcome
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
    // TODO: Fix this by constructing appropriate test data
    itSendsTheseStates(result, [
      { state: { turnNum: 1 } },
      { state: { turnNum: 2 } },
      { state: { turnNum: 3 } },
    ]);
  });

  describe(scenarioStepDescription(scenario.prepareG), () => {
    const { state, sharedData, action } = scenario.prepareG;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorFunding');
    itTransitionsSubstateTo(
      protocolState,
      'indirectGuarantorFunding',
      'LedgerFunding.WaitForNewLedgerChannel',
    );

    itSendsTheseStates(result, [
      {
        state: {
          turnNum: 0,
          channel: {
            participants: [asAddress, hubAddress],
            channelNonce: expect.any(Number),
            chainId: '0x1',
          },
        },
      },
    ]);
  });

  describe(scenarioStepDescription(scenario.fundG), () => {
    const { state, sharedData, action } = scenario.fundG;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForApplicationFunding');
    itTransitionsSubstateTo(
      protocolState,
      'indirectApplicationFunding',
      'ConsensusUpdate.CommitmentSent',
    );
  });

  describe(scenarioStepDescription(scenario.fundApp), () => {
    const { state, sharedData, action } = scenario.fundApp;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.Success');
    itSendsNoMessage(result);
  });
});

describe('app funding commitment received early', () => {
  const scenario = scenarios.appFundingCommitmentReceivedEarly;

  describe(scenarioStepDescription(scenario.appFundingCommitmentReceivedEarly), () => {
    const { state, sharedData, action } = scenario.appFundingCommitmentReceivedEarly;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForGuarantorFunding');
  });

  describe(scenarioStepDescription(scenario.fundingSuccess), () => {
    const { state, sharedData, action } = scenario.fundingSuccess;
    const { protocolState } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'VirtualFunding.WaitForApplicationFunding');
  });
});
