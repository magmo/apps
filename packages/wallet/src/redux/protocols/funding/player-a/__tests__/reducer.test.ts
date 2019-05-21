import * as scenarios from './scenarios';
import * as states from '../states';
import { fundingReducer as reducer } from '../reducer';
import { ProtocolStateWithSharedData } from '../../..';
import { itSendsThisMessage, itSendsThisDisplayEventType } from '../../../../__tests__/helpers';
import { sendStrategyProposed } from '../../../../../communication';
import { FUNDING_SUCCESS, HIDE_WALLET } from 'magmo-wallet-client';
import { FundingStateType } from '../../states';

function whenIn(state) {
  return `when in ${state}`;
}

describe('happyPath', () => {
  const scenario = scenarios.happyPath;

  describe(whenIn('Funding.PlayerA.WaitForStrategyChoice'), () => {
    const { state, store } = scenario.states.waitForStrategyChoice;
    const action = scenario.actions.strategyChosen;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForStrategyResponse');
    const { processId, strategy, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyProposed(opponentAddress, processId, strategy));
  });

  describe(whenIn('Funding.PlayerA.WaitForStrategyResponse'), () => {
    const { state, store } = scenario.states.waitForStrategyResponse;
    const action = scenario.actions.strategyApproved;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForFunding');
  });

  describe(whenIn('Funding.PlayerA.WaitForFunding'), () => {
    const { state, store } = scenario.states.waitForFunding;
    const action = scenario.actions.fundingSuccess;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForSuccessConfirmation');
  });

  describe(whenIn('Funding.PlayerA.WaitForSuccessConfirmation'), () => {
    const { state, store } = scenario.states.waitForSuccessConfirmation;
    const action = scenario.actions.successConfirmed;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('When a strategy is rejected', () => {
  const scenario = scenarios.rejectedStrategy;

  describe(whenIn('Funding.PlayerA.WaitForStrategyResponse'), () => {
    const { state, store } = scenario.states.waitForStrategyResponse;
    const action = scenario.actions.strategyRejected;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.WaitForStrategyChoice');
  });
});

describe('when cancelled by the opponent', () => {
  const scenario = scenarios.cancelledByOpponent;

  describe(whenIn('Funding.PlayerA.WaitForStrategyChoice'), () => {
    const { state, store } = scenario.states.waitForStrategyChoice;
    const action = scenario.actions.cancelledByB;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerA.WaitForStrategyResponse'), () => {
    const { state, store } = scenario.states.waitForStrategyResponse;
    const action = scenario.actions.cancelledByB;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

describe('when cancelled by the user', () => {
  const scenario = scenarios.cancelledByUser;
  describe(whenIn('Funding.PlayerA.WaitForStrategyChoice'), () => {
    const { state, store } = scenario.states.waitForStrategyChoice;
    const action = scenario.actions.cancelledByA;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerA.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerA.WaitForStrategyResponse'), () => {
    const { state, store } = scenario.states.waitForStrategyResponse;
    const action = scenario.actions.cancelledByA;
    const result = reducer(state, store, action);

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
