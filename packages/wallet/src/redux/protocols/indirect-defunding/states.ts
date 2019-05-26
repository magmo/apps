import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';
import { ChallengerState } from '../dispute/challenger/states';
import { ResponderState } from '../dispute/responder/states';
// -------
// States
// -------

export interface ConfirmLedgerUpdate {
  type: 'IndirectDefunding.ConfirmLedgerUpate';
  processId: string;
  ledgerId: string;
  channelId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
}

export interface WaitForLedgerUpdate {
  type: 'IndirectDefunding.WaitForLedgerUpdate';
  processId: string;
  ledgerId: string;
  channelId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
}

export interface WaitForDisputeChallenger {
  type: 'IndirectDefunding.WaitForDisputeChallenger';
  processId: string;
  ledgerId: string;
  channelId: string;
  disputeState: ChallengerState;
}

export interface WaitForDisputeResponder {
  type: 'IndirectDefunding.WaitForDisputeResponder';
  processId: string;
  ledgerId: string;
  channelId: string;
  disputeState: ResponderState;
}

export interface AcknowledgeLedgerFinalizedOffChain {
  type: 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain';
  processId: string;
  ledgerId: string;
  channelId: string;
}

export interface AcknowledgeLedgerFinalizedOnChain {
  type: 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain';
  processId: string;
  ledgerId: string;
  channelId: string;
}

export type FailureReason = 'Received Invalid Commitment' | 'Channel Not Closed';
export interface Failure {
  type: 'IndirectDefunding.Failure';
  reason: string;
}

export interface SuccessOn {
  type: 'IndirectDefunding.FinalizedOnChain';
}

export interface SuccessOff {
  type: 'IndirectDefunding.FinalizedOffChain';
}

// -------
// Constructors
// -------

export const confirmLedgerUpate: StateConstructor<ConfirmLedgerUpdate> = p => {
  return {
    ...p,
    type: 'IndirectDefunding.ConfirmLedgerUpate',
  };
};
export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  return {
    ...p,
    type: 'IndirectDefunding.WaitForLedgerUpdate',
  };
};

export const waitForDisputeChallenger: StateConstructor<WaitForDisputeChallenger> = p => {
  return { ...p, type: 'IndirectDefunding.WaitForDisputeChallenger' };
};

export const waitForDisputeResponder: StateConstructor<WaitForDisputeResponder> = p => {
  return { ...p, type: 'IndirectDefunding.WaitForDisputeResponder' };
};

export const acknowledgeLedgerFinalizedOffChain: StateConstructor<
  AcknowledgeLedgerFinalizedOffChain
> = p => {
  return { ...p, type: 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain' };
};

export const acknowledgeLedgerFinalizedOnChain: StateConstructor<
  AcknowledgeLedgerFinalizedOnChain
> = p => {
  return { ...p, type: 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain' };
};

export const successOn: StateConstructor<SuccessOn> = p => {
  return { ...p, type: 'IndirectDefunding.FinalizedOnChain' };
};

export const successOff: StateConstructor<SuccessOff> = p => {
  return { ...p, type: 'IndirectDefunding.FinalizedOffChain' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'IndirectDefunding.Failure' };
};

// -------
// Unions and Guards
// -------

export type NonTerminalIndirectDefundingState =
  | WaitForLedgerUpdate
  | ConfirmLedgerUpdate
  | WaitForDisputeChallenger
  | WaitForDisputeResponder
  | AcknowledgeLedgerFinalizedOffChain
  | AcknowledgeLedgerFinalizedOnChain;

export type IndirectDefundingState =
  | NonTerminalIndirectDefundingState
  | SuccessOn
  | SuccessOff
  | Failure;

export type IndirectDefundingStateType = IndirectDefundingState['type'];

export function isTerminal(
  state: IndirectDefundingState,
): state is Failure | SuccessOn | SuccessOff {
  return (
    state.type === 'IndirectDefunding.Failure' ||
    state.type === 'IndirectDefunding.FinalizedOnChain' ||
    state.type === 'IndirectDefunding.FinalizedOffChain'
  );
}

export function isIndirectDefundingState(state: ProtocolState): state is IndirectDefundingState {
  return (
    state.type === 'IndirectDefunding.ConfirmLedgerUpate' ||
    state.type === 'IndirectDefunding.WaitForLedgerUpdate' ||
    state.type === 'IndirectDefunding.WaitForDisputeChallenger' ||
    state.type === 'IndirectDefunding.WaitForDisputeResponder' ||
    state.type === 'IndirectDefunding.AcknowledgeLedgerFinalizedOffChain' ||
    state.type === 'IndirectDefunding.AcknowledgeLedgerFinalizedOnChain' ||
    state.type === 'IndirectDefunding.Failure' ||
    state.type === 'IndirectDefunding.FinalizedOffChain' ||
    state.type === 'IndirectDefunding.FinalizedOnChain'
  );
}
