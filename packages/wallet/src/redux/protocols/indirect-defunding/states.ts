import { StateConstructor } from '../../utils';
// -------
// States
// -------

export type FailureReason = 'Received Invalid Commitment' | 'Channel Not Closed';

export interface WaitForConclude {
  type: 'IndirectDefunding.WaitForConclude';
  processId: string;
  ledgerId: string;
  channelId: string;
}
export interface Failure {
  type: 'IndirectDefunding.Failure';
  reason: string;
}

export interface Success {
  type: 'IndirectDefunding.Success';
}

// -------
// Constructors
// -------

export const waitForConclude: StateConstructor<WaitForConclude> = p => {
  const { processId, ledgerId, channelId } = p;
  return {
    type: 'IndirectDefunding.WaitForConclude',
    processId,
    ledgerId,
    channelId,
  };
};
export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  const { processId, ledgerId, channelId, proposedAllocation, proposedDestination } = p;
  return {
    type: 'IndirectDefunding.WaitForLedgerUpdate',
    processId,
    ledgerId,
    channelId,
    proposedAllocation,
    proposedDestination,
  };
};

export const success: StateConstructor<Success> = p => {
  return { type: 'IndirectDefunding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  const { reason } = p;
  return { type: 'IndirectDefunding.Failure', reason };
};

// -------
// Unions and Guards
// -------

export type IndirectDefundingState = WaitForLedgerUpdate | WaitForConclude | Success | Failure;
export type IndirectDefundingStateType = IndirectDefundingState['type'];

export interface WaitForLedgerUpdate {
  type: 'IndirectDefunding.WaitForLedgerUpdate';
  processId: string;
  ledgerId: string;
  channelId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
}

export function isTerminal(state: IndirectDefundingState): state is Failure | Success {
  return state.type === 'IndirectDefunding.Failure' || state.type === 'IndirectDefunding.Success';
}
