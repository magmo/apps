import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';
import { ChannelSyncState } from '../channel-sync/states';

export type FailureReason =
  | 'ReceivedInvalidCommitment'
  | 'SignatureFailure'
  | 'LedgerTopUpFailure'
  | 'PostFundSetupFailure'
  | 'ChannelSyncFailure';

export interface WaitForLedgerTopUp {
  type: 'ExistingLedgerFunding.WaitForLedgerTopUp';
  processId: string;
  ledgerTopUpState: any;
  channelId: string;
  ledgerId: string;
}

export interface WaitForPostFundSetup {
  type: 'ExistingLedgerFunding.WaitForPostFundSetup';
  processId: string;
  channelId: string;
  ledgerId: string;
}

export interface WaitForLedgerUpdate {
  type: 'ExistingLedgerFunding.WaitForLedgerUpdate';
  processId: string;
  channelId: string;
  ledgerId: string;
}
export interface WaitForChannelSync {
  type: 'ExistingLedgerFunding.WaitForChannelSync';
  processId: string;
  channelSyncState: ChannelSyncState;
  channelId: string;
  ledgerId: string;
}
export interface Failure {
  type: 'ExistingLedgerFunding.Failure';
  reason: FailureReason;
}

export interface Success {
  type: 'ExistingLedgerFunding.Success';
}

export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  return {
    ...p,
    type: 'ExistingLedgerFunding.WaitForLedgerUpdate',
  };
};

export const waitForChannelSync: StateConstructor<WaitForChannelSync> = p => {
  return {
    ...p,
    type: 'ExistingLedgerFunding.WaitForChannelSync',
  };
};

export const waitForLedgerTopUp: StateConstructor<WaitForLedgerTopUp> = p => {
  return {
    ...p,
    type: 'ExistingLedgerFunding.WaitForLedgerTopUp',
  };
};

export const waitForPostFundSetup: StateConstructor<WaitForPostFundSetup> = p => {
  return {
    ...p,
    type: 'ExistingLedgerFunding.WaitForPostFundSetup',
  };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'ExistingLedgerFunding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'ExistingLedgerFunding.Failure' };
};
export type NonTerminalExistingLedgerFundingState =
  | WaitForLedgerTopUp
  | WaitForLedgerUpdate
  | WaitForPostFundSetup
  | WaitForChannelSync;
export type ExistingLedgerFundingState = NonTerminalExistingLedgerFundingState | Success | Failure;

export function isExistingLedgerFundingState(
  state: ProtocolState,
): state is ExistingLedgerFundingState {
  return state.type.indexOf('ExistingLedgerFunding') === 0;
}

export function isTerminal(state: ExistingLedgerFundingState): state is Success | Failure {
  return (
    state.type === 'ExistingLedgerFunding.Failure' || state.type === 'ExistingLedgerFunding.Success'
  );
}
