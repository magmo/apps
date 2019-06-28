import { getProcessId, walletReducer } from '../reducer';

import { WalletProtocol } from '../../communication';
import * as adjudicatorState from '../adjudicator-state/reducer';
import { fundingRequested } from '../protocols/actions';
import * as fundProtocol from '../protocols/funding';
import * as NewLedgerFundingActions from '../protocols/new-ledger-funding/actions';
import { TwoPartyPlayerIndex } from '../types';
import * as actions from './../actions';
import * as states from './../state';
import * as scenarios from './test-scenarios';
const { channelId } = scenarios;

const defaults = {
  ...states.EMPTY_SHARED_DATA,
  uid: 'uid',
  processStore: {},
  adjudicatorStore: {},
  address: 'address',
  privateKey: 'privateKey',
};

const initializedState = states.initialized({ ...defaults });

describe('when a NewProcessAction arrives', () => {
  const action = fundingRequested({ channelId, playerIndex: TwoPartyPlayerIndex.A });
  const processId = getProcessId(action);
  const initialize = jest.fn(() => ({
    protocolState: 'protocolState',
    sharedData: { prop: 'value' },
  }));
  Object.defineProperty(fundProtocol, 'initialize', { value: initialize });

  const updatedState = walletReducer(initializedState, action);
  it('calls initialize', () => {
    expect(initialize).toHaveBeenCalledWith(
      states.EMPTY_SHARED_DATA,
      action.channelId,
      processId,
      action.playerIndex,
    );
  });

  it('stores the process in the process store', () => {
    expect((updatedState as states.Initialized).processStore).toMatchObject({
      [processId]: { protocolState: 'protocolState' },
    });
  });
});

describe('when a ProcessAction arrives', () => {
  const processId = '0xprocessId';
  const protocolState = {};
  const processState: states.ProcessState = {
    processId,
    protocol: WalletProtocol.Funding,
    channelsToMonitor: [],
    protocolState,
  };
  const state = { ...initializedState, processStore: { [processId]: processState } };

  const action = NewLedgerFundingActions.playerA.strategyApproved({
    channelId,
    processId: '0xprocessId',
    consensusLibrary: '0xf00',
  });
  const newLedgerFundingReducer = jest.fn(() => ({
    protocolState: 'protocolState',
    sharedData: 'sharedData ',
  }));
  Object.defineProperty(fundProtocol, 'reducer', {
    value: newLedgerFundingReducer,
  });

  walletReducer(state, action);
  it('calls the correct reducer', () => {
    expect(newLedgerFundingReducer).toHaveBeenCalledWith(
      protocolState,
      states.EMPTY_SHARED_DATA,
      action,
    );
  });
});

describe('when a updateSharedData action arrives', () => {
  const reducer = jest.fn(() => ({}));
  Object.defineProperty(adjudicatorState, 'adjudicatorStateReducer', { value: reducer });

  const action = actions.challengeExpiredEvent({
    processId: '123',
    channelId: '123',
    timestamp: 1,
  });
  const state = { ...initializedState, adjudicatorState: {} };
  walletReducer(initializedState, action);

  it('passes the action to the adjudicator state reducer', () => {
    expect(reducer).toHaveBeenCalledWith(state.adjudicatorState, action);
  });
});
