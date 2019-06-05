import * as scenarios from './scenarios';
import { initialize, ledgerTopUpReducer } from '../reducer';
import { LedgerTopUpState, LedgerTopUpStateType } from '../states';
import { ProtocolStateWithSharedData } from '../..';

describe('player A both players need a top up', () => {
  const scenario = scenarios.playerABothPlayersTopUp;
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

    itTransitionsTo(initialState, 'LedgerTopUp.WaitForLedgerUpdateForPlayerA');
  });
  describe('when in WaitForLedgerUpdateForPlayerA', () => {
    const { action, sharedData, state } = scenario.waitForLedgerUpdateForPlayerA;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForPlayerA');
  });
  describe('when in WaitForDirectFundingForPlayerA', () => {
    const { action, sharedData, state } = scenario.waitForLedgerUpdateForPlayerA;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForLedgerUpdateForPlayerB');
  });
  describe('when in WaitForLedgerUpdateForPlayerB', () => {
    const { action, sharedData, state } = scenario.waitForLedgerUpdateForPlayerB;
    const updatedState = ledgerTopUpReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'LedgerTopUp.WaitForDirectFundingForPlayerB');
  });
  describe('when in WaitForDirectFundingForPlayerB', () => {
    const { action, sharedData, state } = scenario.waitForDirectFundingForPlayerB;
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
