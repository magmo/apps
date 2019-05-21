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
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyApproval');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForFunding');

    const { processId, opponentAddress } = scenario;
    itSendsThisMessage(result, sendStrategyApproved(opponentAddress, processId));
  });

  describe(whenIn('Funding.PlayerB.WaitForFunding'), () => {
    const { state, sharedData, action } = scenario.waitForFunding;

    const result = reducer(state, sharedData, action);
    itTransitionsTo(result, 'Funding.PlayerB.WaitForSuccessConfirmation');
  });

  describe(whenIn('Funding.PlayerB.WaitForSuccessConfirmation'), () => {
    const { state, sharedData, action } = scenario.waitForSuccessConfirmation;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Success');
    itSendsThisMessage(result, FUNDING_SUCCESS);
    itSendsThisDisplayEventType(result, HIDE_WALLET);
  });
});

describe('When a strategy is rejected', () => {
  const scenario = scenarios.rejectedStrategy;

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.WaitForStrategyProposal');
  });
});

describe('when cancelled by the opponent', () => {
  const scenario = scenarios.cancelledByOpponent;

  describe(whenIn('Funding.PlayerB.WaitForStrategyProposal'), () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
    const { state, sharedData, action } = scenario.waitForStrategyApproval;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });
});

describe('when cancelled by the user', () => {
  const scenario = scenarios.cancelledByUser;

  describe(whenIn('Funding.PlayerB.WaitForStrategyProposal'), () => {
    const { state, sharedData, action } = scenario.waitForStrategyProposal;

    const result = reducer(state, sharedData, action);

    itTransitionsTo(result, 'Funding.PlayerB.Failure');
    itSendsThisMessage(result, 'WALLET.FUNDING.FAILURE');
  });

  describe(whenIn('Funding.PlayerB.WaitForStrategyApproval'), () => {
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
