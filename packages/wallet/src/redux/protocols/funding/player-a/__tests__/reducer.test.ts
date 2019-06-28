import { FUNDING_SUCCESS, HIDE_WALLET } from 'magmo-wallet-client';
import { ProtocolStateWithSharedData } from '../../..';
import { sendStrategyProposed } from '../../../../../communication';
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

  describeScenarioStep(scenario.waitForStrategyChoice, () => {
    const { state, sharedData, action } = scenario.waitForStrategyChoice;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForStrategyResponse');
    const { processId, strategy, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyProposed(opponentAddress, processId, strategy));
  });

  describeScenarioStep(scenario.waitForStrategyResponse, () => {
    const { state, sharedData, action } = scenario.waitForStrategyResponse;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForFunding');
  });

  describeScenarioStep(scenario.waitForFunding, () => {
    const { state, sharedData, action } = scenario.waitForFunding;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForSuccessConfirmation');
  });

  describeScenarioStep(scenario.waitForSuccessConfirmation, () => {
    const { state, sharedData, action } = scenario.waitForSuccessConfirmation;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('existing ledger channel happy path', () => {
  const scenario = scenarios.existingChannelHappyPath;

  describeScenarioStep(scenario.waitForStrategyChoice, () => {
    const { state, sharedData, action } = scenario.waitForStrategyChoice;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForStrategyResponse');
    const { processId, strategy, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyProposed(opponentAddress, processId, strategy));
  });

  describeScenarioStep(scenario.waitForStrategyResponse, () => {
    const { state, sharedData, action } = scenario.waitForStrategyResponse;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForFunding');
  });

  describeScenarioStep(scenario.waitForFunding, () => {
    const { state, sharedData, action } = scenario.waitForFunding;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForSuccessConfirmation');
  });

  describeScenarioStep(scenario.waitForSuccessConfirmation, () => {
    const { state, sharedData, action } = scenario.waitForSuccessConfirmation;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('When a strategy is rejected', () => {
  const scenario = scenarios.rejectedStrategy;

  describeScenarioStep(scenario.waitForStrategyResponse, () => {
    const { state, sharedData, action } = scenario.waitForStrategyResponse;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForStrategyChoice');
  });
});

describe('when cancelled by the opponent', () => {
  const scenario = scenarios.cancelledByOpponent;

  describeScenarioStep(scenario.waitForStrategyChoice, () => {
    const { state, sharedData, action } = scenario.waitForStrategyChoice;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describeScenarioStep(scenario.waitForStrategyResponse, () => {
    const { state, sharedData, action } = scenario.waitForStrategyResponse;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

describe('when cancelled by the user', () => {
  const scenario = scenarios.cancelledByUser;
  describeScenarioStep(scenario.waitForStrategyChoice, () => {
    const { state, sharedData, action } = scenario.waitForStrategyChoice;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describeScenarioStep(scenario.waitForStrategyResponse, () => {
    const { state, sharedData, action } = scenario.waitForStrategyResponse;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
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
