import * as scenarios from './scenarios';
import { indirectFundingReducer } from '../../reducer';
import { ProtocolStateWithSharedData } from 'src/redux/protocols';
import { IndirectFundingState } from '../../state';
import { SignedCommitment } from '../../../../channel-state/shared/state';
import { getLastMessage } from '../../../../state';

describe('happy-path scenario', () => {
  const scenario = scenarios.happyPath;
  describe('initializing', () => {});
  describe('when in WaitForPreFundL0', () => {
    const { state, action, reply } = scenario.waitForPreFundL0;
    const updatedState = indirectFundingReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'BWaitForDirectFunding');
    itSendsMessage(updatedState, reply);
  });
  describe('when in WaitForDirectFunding', () => {});
  describe('when in WaitForLedgerUpdate0', () => {});
  describe('when in WaitForPostFund0', () => {});
});

describe('ledger-funding-fails scenario', () => {
  const scenario = scenarios.ledgerFundingFails;
  describe('when in WaitForDirectFunding', () => {
    const { state, action } = scenario.waitForDirectFunding;
    const updatedState = indirectFundingReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'BWaitForDirectFunding');
  });
});

// -------
// Helpers
// -------
type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

function itTransitionsTo(state: ReturnVal, type: IndirectFundingState['type']) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function itSendsMessage(state: ReturnVal, message: SignedCommitment) {
  it(`sends a message`, () => {
    expect(getLastMessage(state.sharedData)).toEqual(message);
  });
}
