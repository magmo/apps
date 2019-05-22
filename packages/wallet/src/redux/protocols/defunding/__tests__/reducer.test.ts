import * as states from '../states';
import { initialize, defundingReducer } from '../reducer';
import * as scenarios from './scenarios';

const itTransitionsTo = (
  result: { protocolState: states.DefundingState },
  type: states.DefundingStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

const itTransitionsToFailure = (
  result: { protocolState: states.DefundingState },
  failure: states.Failure,
) => {
  it(`transitions to failure with reason ${failure.reason}`, () => {
    expect(result.protocolState).toMatchObject(failure);
  });
};

describe('directly funded happy path', () => {
  const scenario = scenarios.directlyFundingChannelHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'Defunding.WaitForWithdrawal');
  });
  describe(`when in Defunding.WaitForWithdrawal`, () => {
    const { state, sharedData, action } = scenario.waitForWithdrawal;

    const result = defundingReducer(state, sharedData, action);

    itTransitionsTo(result, 'Defunding.Success');
  });
});

describe('directly funded failure', () => {
  const scenario = scenarios.directlyFundingFailure;

  describe(`when in Defunding.WaitForWithdrawal`, () => {
    const { state, sharedData, action } = scenario.waitForWithdrawal;

    const result = defundingReducer(state, sharedData, action);

    itTransitionsToFailure(result, states.failure('Withdrawal Failure'));
  });
});

describe('channel not closed', () => {
  const scenario = scenarios.channelNotClosed;
  const { sharedData, processId, channelId } = scenario;
  describe('when initializing', () => {
    const result = initialize(processId, channelId, sharedData);

    itTransitionsToFailure(result, scenario.failure);
  });
});

describe('indirectly funded happy path', () => {
  const scenario = scenarios.indirectlyFundingChannelHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, sharedData } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'Defunding.WaitForIndirectDefunding');
  });
  describe(`when in Defunding.WaitForIndirectDefunding`, () => {
    const { state, action, sharedData } = scenario.waitForLedgerDefunding;
    const result = defundingReducer(state, sharedData, action);

    itTransitionsTo(result, 'Defunding.WaitForWithdrawal');
  });
  describe(`when in Defunding.WaitForWithdrawal`, () => {
    const { state, action, sharedData } = scenario.waitForWithdrawal;
    const result = defundingReducer(state, sharedData, action);

    itTransitionsTo(result, 'Defunding.Success');
  });
});

describe('indirectly funded failure', () => {
  const scenario = scenarios.indirectlyFundingFailure;

  describe(`when in Defunding.WaitForIndirectDefunding`, () => {
    const { state, action, sharedData } = scenario.waitForLedgerDefunding;
    const result = defundingReducer(state, sharedData, action);

    itTransitionsToFailure(result, states.failure('Ledger De-funding Failure'));
  });
});
