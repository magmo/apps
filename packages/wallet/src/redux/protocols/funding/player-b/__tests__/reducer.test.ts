import { FUNDING_SUCCESS, HIDE_WALLET } from 'magmo-wallet-client';
import { ProtocolStateWithSharedData } from '../../..';
import { sendStrategyApproved } from '../../../../../communication';
import {
  describeScenarioStep,
  itSendsThisDisplayEventType,
  itSendsThisMessage,
} from '../../../../__tests__/helpers';
import { FundingStateType } from '../../states';
import { fundingReducer as reducer } from '../reducer';
import * as states from '../states';
import * as scenarios from './scenarios';

describe('new ledger channel happy path', () => {
  const scenario = scenarios.newChannelHappyPath;

  describeScenarioStep(scenario.waitForStrategyProposal, () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyApproval');
  });

  describeScenarioStep(scenario.waitForStrategyApproval, () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForFunding');

    const { processId, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyApproved(opponentAddress, processId));
  });

  describeScenarioStep(scenario.waitForFunding, () => {
    const { state, sharedData, action } = scenario.waitForFunding;

    const result = reducer(state, sharedData, action);
    itTransitionsTo(result, 'Funding.PlayerB.WaitForSuccessConfirmation');
  });

  describeScenarioStep(scenario.waitForSuccessConfirmation, () => {
    const { state, sharedData, action } = scenario.waitForSuccessConfirmation;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('existing ledger channel happy path', () => {
  const scenario = scenarios.existingChannelHappyPath;

  describeScenarioStep(scenario.waitForStrategyProposal, () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyApproval');
  });

  describeScenarioStep(scenario.waitForStrategyApproval, () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForFunding');

    const { processId, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyApproved(opponentAddress, processId));
  });

  describeScenarioStep(scenario.waitForFunding, () => {
    const { state, sharedData, action } = scenario.waitForFunding;

    const result = reducer(state, sharedData, action);
    itTransitionsTo(result, 'Funding.PlayerB.WaitForSuccessConfirmation');
  });

  describeScenarioStep(scenario.waitForSuccessConfirmation, () => {
    const { state, sharedData, action } = scenario.waitForSuccessConfirmation;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('When a strategy is rejected', () => {
  const scenario = scenarios.rejectedStrategy;

  describeScenarioStep(scenario.waitForStrategyApproval, () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyProposal');
  });
});

describe('when cancelled by the opponent', () => {
  const scenario = scenarios.cancelledByOpponent;

  describeScenarioStep(scenario.waitForStrategyProposal, () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describeScenarioStep(scenario.waitForStrategyApproval, () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

describe('when cancelled by the user', () => {
  const scenario = scenarios.cancelledByUser;

  describeScenarioStep(scenario.waitForStrategyProposal, () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describeScenarioStep(scenario.waitForStrategyApproval, () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

function itTransitionsTo(
  result: ProtocolStateWithSharedData<states.FundingState>,
  type: FundingStateType,
) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}
