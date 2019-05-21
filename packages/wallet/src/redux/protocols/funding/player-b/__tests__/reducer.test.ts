import * as scenarios from './scenarios';
import * as states from '../states';
import { fundingReducer as reducer } from '../reducer';
import { ProtocolStateWithSharedData } from '../../..';
import { itSendsThisMessage, itSendsThisDisplayEventType } from '../../../../__tests__/helpers';
import { sendStrategyApproved } from '../../../../../communication';
import { FUNDING_SUCCESS, HIDE_WALLET } from 'magmo-wallet-client';
import { FundingStateType } from '../../states';

function whenIn(state) {
  return `when in ${state}`;
}

describe('HAPPY PATH', () => {
  const scenario = scenarios.happyPath;

  describe(whenIn('Funding.PlayerB.WaitForStrategyProposal'), () => {
    const { state, store } = scenario.states.waitForStrategyProposal;
    const action = scenario.actions.strategyProposed;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyApproval');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, store } = scenario.states.waitForStrategyApproval;
    const action = scenario.actions.strategyApproved;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForFunding');

    const { processId, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyApproved(opponentAddress, processId));
  });

  describe(whenIn('Funding.PlayerB.WaitForFunding'), () => {
    const { state, store } = scenario.states.waitForFunding;
    const action = scenario.actions.fundingSuccess;
    const result = reducer(state, store, action);
    itTransitionsTo(result, 'Funding.PlayerB.WaitForSuccessConfirmation');
  });

  describe(whenIn('Funding.PlayerB.WaitForSuccessConfirmation'), () => {
    const { state, store } = scenario.states.waitForSuccessConfirmation;
    const action = scenario.actions.successConfirmed;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('When a strategy is rejected', () => {
  const scenario = scenarios.rejectedStrategy;

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, store } = scenario.states.waitForStrategyApproval;
    const action = scenario.actions.strategyRejected;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyProposal');
  });
});

describe('when cancelled by the opponent', () => {
  const scenario = scenarios.cancelledByOpponent;

  describe(whenIn('Funding.PlayerB.WaitForStrategyProposal'), () => {
    const { state, store } = scenario.states.waitForStrategyProposal;
    const action = scenario.actions.cancelledByA;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, store } = scenario.states.waitForStrategyApproval;
    const action = scenario.actions.cancelledByA;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

describe('when cancelled by the user', () => {
  const scenario = scenarios.cancelledByUser;

  describe(whenIn('Funding.PlayerB.WaitForStrategyProposal'), () => {
    const { state, store } = scenario.states.waitForStrategyProposal;
    const action = scenario.actions.cancelledByB;
    const result = reducer(state, store, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, store } = scenario.states.waitForStrategyApproval;
    const action = scenario.actions.cancelledByB;
    const result = reducer(state, store, action);

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
