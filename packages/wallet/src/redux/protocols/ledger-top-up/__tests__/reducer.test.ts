import * as scenarios from './scenarios';
import { initialize, ledgerTopUpReducer } from '../reducer';
import { LedgerTopUpState, LedgerTopUpStateType } from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { describeScenarioStep } from '../../../__tests__/helpers';

describe('player A happy path', () => {
  const scenario = scenarios.playerAHappyPath;
  // TODO: Add back tests to verity proposed outcome
  describe('when initializing', () => {
    const initialState = initialize(scenario.initialize);
    // it('requests the correct allocation/destination updates', () => {
    //   const consensusUpdate = getProposedOutcome(initialState.protocolState);
    //   expect(consensusUpdate.proposedAllocation).toEqual(['0x03', '0x04']);
    //   expect(consensusUpdate.proposedDestination).toEqual([bsAddress, asAddress]);
    // });
    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
  });

  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x02');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x07');
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
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x0');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x09');
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
    const initialState = initialize(scenario.initialize);

    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
    it('requests the correct allocation/destination updates', () => {
      // const consensusUpdate = getProposedOutcome(initialState.protocolState);
      // expect(consensusUpdate.proposedAllocation).toEqual(['0x03', '0x04']);
      // expect(consensusUpdate.proposedDestination).toEqual([bsAddress, asAddress]);
    });
  });

  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);

    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x0');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x07');
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
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x02');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x09');
    });
  });

  describeScenarioStep(scenario.waitForDirectFundingForB, () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForB;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);

    itTransitionsTo(updatedState, 'LedgerTopUp.Success');
  });
});

describe('player A one user needs top up', () => {
  const scenario = scenarios.playerAOneUserNeedsTopUp;
  describe('when initializing', () => {
    const initialState = initialize(scenario.initialize);

    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
    it('requests the correct allocation/destination updates', () => {
      // const consensusUpdate = getProposedOutcome(initialState.protocolState);
      // expect(consensusUpdate.proposedAllocation).toEqual(['0x03', '0x04']);
      // expect(consensusUpdate.proposedDestination).toEqual([bsAddress, asAddress]);
    });
  });

  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);

    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x02');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x07');
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

    itTransitionsTo(updatedState, 'LedgerTopUp.Success');
  });
});

describe('player B one user needs top up', () => {
  const scenario = scenarios.playerBOneUserNeedsTopUp;
  describe('when initializing', () => {
    const initialState = initialize(scenario.initialize);

    itTransitionsTo(initialState, 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate');
    it('requests the correct allocation/destination updates', () => {
      // const consensusUpdate = getProposedOutcome(initialState.protocolState);
      // expect(consensusUpdate.proposedAllocation).toEqual(['0x03', '0x04']);
      // expect(consensusUpdate.proposedDestination).toEqual([bsAddress, asAddress]);
    });
  });

  describeScenarioStep(scenario.switchOrderAndAddATopUpUpdate, () => {
    const { action, sharedData, state } = scenario.switchOrderAndAddATopUpUpdate;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);

    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForA');
    it('requests the correct deposit amount', () => {
      expect(getRequiredDeposit(updatedState.protocolState)).toEqual('0x0');
      expect(getTotalFundingRequired(updatedState.protocolState)).toEqual('0x07');
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

    itTransitionsTo(updatedState, 'LedgerTopUp.Success');
  });
});

type ReturnVal = ProtocolStateWithSharedData<LedgerTopUpState>;

function itTransitionsTo(state: ReturnVal, type: LedgerTopUpStateType) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function getRequiredDeposit(protocolState: LedgerTopUpState): string {
  if ('directFundingState' in protocolState) {
    return protocolState.directFundingState.requiredDeposit;
  }
  return '0x0';
}

function getTotalFundingRequired(protocolState: LedgerTopUpState): string {
  if ('directFundingState' in protocolState) {
    return protocolState.directFundingState.totalFundingRequired;
  }
  return '0x0';
}

// function getProposedOutcome(protocolState: LedgerTopUpState): Outcome {
//   if ('consensusUpdateState' in protocolState && !isTerminal(protocolState.consensusUpdateState)) {
//     const { proposedOutcome } = protocolState.consensusUpdateState;
//     return proposedOutcome;
//   }
//   return [];
// }
