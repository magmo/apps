import * as scenarios from './scenarios';
import { initialize, ledgerTopUpReducer } from '../reducer';
import { LedgerTopUpState, LedgerTopUpStateType, WaitForDirectFundingForA } from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { describeScenarioStep } from '../../../__tests__/helpers';

describe('player A happy path', () => {
  const scenario = scenarios.playerAHappyPath;
  describe('when initializing', () => {
    const {
      channelId,
      sharedData,
      processId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
    } = scenario.initialize;
    const initialState = initialize(
      processId,
      channelId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      sharedData,
    );

    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
  });
  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(
        (updatedState.protocolState as WaitForDirectFundingForA).directFundingState.requiredDeposit,
      ).toEqual('0x01');
    });
  });
  describeScenarioStep(scenario.waitForDirectFundingForA, () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForA;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.RestoreOrderAndAddBTopUpUpdate');
  });
  describeScenarioStep(scenario.restoreOrderAndAddBTopUpUpdate, () => {
    const { action, sharedData, state } = scenario.restoreOrderAndAddBTopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForB');
    it('requests the correct deposit amount', () => {
      expect(
        (updatedState.protocolState as WaitForDirectFundingForA).directFundingState.requiredDeposit,
      ).toEqual('0x0');
    });
  });
  describeScenarioStep(scenario.waitForDirectFundingForB, () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForB;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.Success');
  });
});

describe('player B happy path', () => {
  const scenario = scenarios.playerBHappyPath;
  describe('when initializing', () => {
    const {
      channelId,
      sharedData,
      processId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
    } = scenario.initialize;
    const initialState = initialize(
      processId,
      channelId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      sharedData,
    );

    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
  });
  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(
        (updatedState.protocolState as WaitForDirectFundingForA).directFundingState.requiredDeposit,
      ).toEqual('0x0');
    });
  });
  describeScenarioStep(scenario.waitForDirectFundingForA, () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForA;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.RestoreOrderAndAddBTopUpUpdate');
  });
  describeScenarioStep(scenario.restoreOrderAndAddBTopUpUpdate, () => {
    const { action, sharedData, state } = scenario.restoreOrderAndAddBTopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForB');
    it('requests the correct deposit amount', () => {
      expect(
        (updatedState.protocolState as WaitForDirectFundingForA).directFundingState.requiredDeposit,
      ).toEqual('0x02');
    });
  });
  describeScenarioStep(scenario.waitForDirectFundingForB, () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForB;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.Success');
  });
});

type ReturnVal = ProtocolStateWithSharedData<LedgerTopUpState>;

function itTransitionsTo(state: ReturnVal, type: LedgerTopUpStateType) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}
