import * as scenarios from './scenarios';
import { initialize, indirectFundingReducer } from '../reducer';
import { IndirectFundingState, IndirectFundingStateType } from '../states';
import { describeScenarioStep } from '../../../__tests__/helpers';
import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../../existing-ledger-funding/reducer';
import { NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../../new-ledger-funding/reducer';

describe('existing ledger funding happy path', () => {
  const scenario = scenarios.existingLedgerFundingHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(
      processId,
      channelId,
      sharedData,
      EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    );
    itTransitionsTo(result.protocolState, 'IndirectFunding.WaitForExistingLedgerFunding');
  });
  describeScenarioStep(scenario.waitForExistingLedgerFunding, () => {
    const { state, sharedData, action } = scenario.waitForExistingLedgerFunding;
    const result = indirectFundingReducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'IndirectFunding.Success');
  });
});

describe('new ledger funding happy path', () => {
  const scenario = scenarios.newLedgerFundingHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(
      processId,
      channelId,
      sharedData,
      NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    );
    itTransitionsTo(result.protocolState, 'IndirectFunding.WaitForNewLedgerFunding');
  });

  describeScenarioStep(scenario.waitForNewLedgerFunding, () => {
    const { state, sharedData, action } = scenario.waitForNewLedgerFunding;
    const result = indirectFundingReducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'IndirectFunding.Success');
  });
});

function itTransitionsTo(protocolState: IndirectFundingState, type: IndirectFundingStateType) {
  it(`transitions to ${type}`, () => {
    expect(protocolState.type).toEqual(type);
  });
}
