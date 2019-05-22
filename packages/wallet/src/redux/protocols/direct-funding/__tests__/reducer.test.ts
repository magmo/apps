import { directFundingStateReducer, initialize } from '../reducer';
import * as states from '../states';
import * as scenarios from './scenarios';
import { ProtocolStateWithSharedData } from '../..';
import { itSendsATransaction } from '../../../__tests__/helpers';

describe('Player A Happy path', () => {
  const scenario = scenarios.aHappyPath;
  describe('on initialize', () => {
    const { action, sharedData } = scenario.initialize;
    const updatedState = initialize(action, sharedData);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForDepositTransaction');
    itSendsATransaction(updatedState);
  });

  describe('when in WaitForDepositTransaction', () => {
    const { action, state, sharedData } = scenario.waitForDepositTransaction;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
  });

  describe('when in WaitForFundingAndPostFundSetup', () => {
    const { action, state, sharedData } = scenario.waitForFundingAndPostFundSetup;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
  });

  describe('when in WaitForPostFundSetup', () => {
    const { action, state, sharedData } = scenario.waitForPostFundSetup;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.FundingSuccess');
  });
});

describe('Player B Happy path', () => {
  const scenario = scenarios.bHappyPath;
  describe('on initialize', () => {
    const { action, sharedData } = scenario.initialize;
    const updatedState = initialize(action, sharedData);
    itTransitionsTo(updatedState, 'DirectFunding.NotSafeToDeposit');
  });
  describe('when in NotSafeToDeposit', () => {
    const { action, state, sharedData } = scenario.notSafeToDeposit;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForDepositTransaction');
    itSendsATransaction(updatedState);
  });

  describe('when in WaitForDepositTransaction', () => {
    const { action, state, sharedData } = scenario.waitForDepositTransaction;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
  });

  describe('when in WaitForFundingAndPostFundSetup', () => {
    const { action, state, sharedData } = scenario.waitForFundingAndPostFundSetup;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
    it('marks funding as received', () => {
      expect(
        (updatedState.protocolState as states.WaitForFundingAndPostFundSetup).channelFunded,
      ).toEqual(true);
    });
  });

  describe('when in WaitForPostFundSetup', () => {
    const { action, state, sharedData } = scenario.waitForPostFundSetup;
    const updatedState = directFundingStateReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.FundingSuccess');
  });
});
describe('transaction-fails scenario', () => {
  describe('when in WaitForDepositTransaction', () => {
    const { state, action, sharedData } = scenarios.transactionFails.waitForDepositTransaction;
    const updatedState = directFundingStateReducer(state, sharedData, action);

    itTransitionsTo(updatedState, 'DirectFunding.FundingFailure');
  });
});

function itTransitionsTo(
  state: ProtocolStateWithSharedData<states.DirectFundingState>,
  type: states.DirectFundingStateType,
) {
  it(`transitions state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}
