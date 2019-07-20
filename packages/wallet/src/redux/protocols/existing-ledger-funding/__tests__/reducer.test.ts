import * as scenarios from './scenarios';
import { initialize, existingLedgerFundingReducer } from '../reducer';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { describeScenarioStep } from '../../../__tests__/helpers';

describe('player A happy path', () => {
  const scenario = scenarios.playerAFullyFundedHappyPath;

  describe('when initializing', () => {
    const {
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    } = scenario.initialize;

    const result = initialize(
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    );
    itTransitionsTo(result, 'ExistingLedgerFunding.WaitForLedgerUpdate');
  });

  describeScenarioStep(scenario.waitForLedgerUpdate, () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingLedgerFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingLedgerFunding.Success');
  });
});

describe('player B happy path', () => {
  const scenario = scenarios.playerBFullyFundedHappyPath;

  describe('when initializing', () => {
    const {
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    } = scenario.initialize;

    const result = initialize(
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    );
    itTransitionsTo(result, 'ExistingLedgerFunding.WaitForLedgerUpdate');
  });

  describeScenarioStep(scenario.waitForLedgerUpdate, () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingLedgerFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingLedgerFunding.Success');
  });
});

describe('player A invalid ledger commitment', () => {
  const scenario = scenarios.playerAInvalidUpdateCommitment;
  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingLedgerFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingLedgerFunding.Failure');
  });
});

describe('player A top up needed', () => {
  const scenario = scenarios.playerATopUpNeeded;
  describe('when initializing', () => {
    const {
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    } = scenario.initialize;

    const result = initialize(
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    );
    itTransitionsTo(result, 'ExistingLedgerFunding.WaitForLedgerTopUp');
  });
});

describe('player B invalid ledger update commitment', () => {
  const scenario = scenarios.playerBInvalidUpdateCommitment;
  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingLedgerFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingLedgerFunding.Failure');
  });
});

describe('player B top up needed', () => {
  const scenario = scenarios.playerATopUpNeeded;
  describe('when initializing', () => {
    const {
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    } = scenario.initialize;

    const result = initialize(
      processId,
      channelId,
      ledgerId,
      targetAllocation,
      targetDestination,
      protocolLocator,
      sharedData,
    );
    itTransitionsTo(result, 'ExistingLedgerFunding.WaitForLedgerTopUp');
  });
});

type ReturnVal = ProtocolStateWithSharedData<states.ExistingLedgerFundingState>;
function itTransitionsTo(state: ReturnVal, type: states.ExistingLedgerFundingState['type']) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}
