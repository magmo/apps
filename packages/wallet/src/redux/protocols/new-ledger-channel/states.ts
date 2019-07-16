import { ProtocolState } from '..';
import { StateConstructor } from '../../utils';
import { DirectFundingState } from '../direct-funding/states';
import { AdvanceChannelState } from '../advance-channel';
import { ConsensusUpdateState } from '../consensus-update';

// -------
// States
// -------

export interface Success {
  type: 'NewLedgerChannel.Success';
}

export interface Failure {
  type: 'NewLedgerChannel.Failure';
}

interface Base {
  channelId: string;
  processId: string;
}

export interface WaitForPreFundSetup extends Base {
  type: 'NewLedgerChannel.WaitForPreFundSetup';
  preFundSetupState: AdvanceChannelState;
}

export interface WaitForDirectFunding extends Base {
  type: 'NewLedgerChannel.WaitForDirectFunding';
  ledgerId: string;
  directFundingState: DirectFundingState;
  postFundSetupState: AdvanceChannelState;
}
export interface WaitForPostFundSetup extends Base {
  type: 'NewLedgerChannel.WaitForPostFundSetup';
  ledgerId: string;
  postFundSetupState: AdvanceChannelState;
  consensusUpdateState: ConsensusUpdateState;
}
export interface WaitForLedgerUpdate extends Base {
  type: 'NewLedgerChannel.WaitForLedgerUpdate';
  ledgerId: string;
  consensusUpdateState: ConsensusUpdateState;
}
// ------------
// Constructors
// ------------

export const success: StateConstructor<Success> = p => {
  return { type: 'NewLedgerChannel.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { type: 'NewLedgerChannel.Failure' };
};
export const waitForPreFundSetup: StateConstructor<WaitForPreFundSetup> = p => {
  return { ...p, type: 'NewLedgerChannel.WaitForPreFundSetup' };
};

export const waitForDirectFunding: StateConstructor<WaitForDirectFunding> = p => {
  return {
    ...p,
    type: 'NewLedgerChannel.WaitForDirectFunding',
  };
};

export const waitForPostFundSetup: StateConstructor<WaitForPostFundSetup> = p => {
  return { ...p, type: 'NewLedgerChannel.WaitForPostFundSetup' };
};

export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  return { ...p, type: 'NewLedgerChannel.WaitForLedgerUpdate' };
};

// -------
// Unions and Guards
// -------

export type NonTerminalNewLedgerChannelState =
  | WaitForPreFundSetup
  | WaitForDirectFunding
  | WaitForPostFundSetup
  | WaitForLedgerUpdate;

export type NewLedgerChannelState = NonTerminalNewLedgerChannelState | Success | Failure;
export type NewLedgerChannelStateType = NewLedgerChannelState['type'];

export function isNewLedgerChannelState(state: ProtocolState): state is NewLedgerChannelState {
  return (
    state.type === 'NewLedgerChannel.Failure' ||
    state.type === 'NewLedgerChannel.Success' ||
    state.type === 'NewLedgerChannel.WaitForDirectFunding' ||
    state.type === 'NewLedgerChannel.WaitForPostFundSetup' ||
    state.type === 'NewLedgerChannel.WaitForLedgerUpdate' ||
    state.type === 'NewLedgerChannel.WaitForPreFundSetup'
  );
}

export function isTerminal(state: NewLedgerChannelState): state is Failure | Success {
  return state.type === 'NewLedgerChannel.Failure' || state.type === 'NewLedgerChannel.Success';
}
