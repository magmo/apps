import { NonTerminalTransactionSubmissionState as NonTerminalTSState } from '../../transaction-submission/states';
import { Commitment } from '../../../../domain';
import { ProtocolState } from '../..';
import { DefundingState } from '../../defunding';
import { Constructor } from '../../../utils';

// -------
// States
// -------

export const enum FailureReason {
  TransactionFailure = 'Transaction failed',
}

export interface WaitForApproval {
  type: 'Responding.WaitForApproval';
  processId: string;
  channelId: string;
  challengeCommitment: Commitment;
}

export interface WaitForTransaction {
  type: 'Responding.WaitForTransaction';
  processId: string;
  channelId: string;
  transactionSubmissionState: NonTerminalTSState;
}
export interface WaitForAcknowledgement {
  type: 'Responding.WaitForAcknowledgement';
  processId: string;
  channelId: string;
}

export interface WaitForResponse {
  type: 'Responding.WaitForResponse';
  processId: string;
  channelId: string;
}

export interface AcknowledgeTimeout {
  type: 'Responding.AcknowledgeTimeout';
  processId: string;
  channelId: string;
}

export interface WaitForDefund {
  type: 'Responding.WaitForDefund';
  processId: string;
  defundingState: DefundingState;
  channelId: string;
}

export interface AcknowledgeDefundingSuccess {
  type: 'Responding.AcknowledgeDefundingSuccess';
  processId: string;
  channelId: string;
}

export interface AcknowledgeClosedButNotDefunded {
  type: 'Responding.AcknowledgeClosedButNotDefunded';
  processId: string;
  channelId: string;
}
export interface Failure {
  type: 'Responding.Failure';
  reason: string;
}

export interface ClosedAndDefunded {
  type: 'Responding.ClosedAndDefunded';
}

export interface ClosedButNotDefunded {
  type: 'Responding.ClosedButNotDefunded';
}

export interface Success {
  type: 'Responding.Success';
}

// -------
// Constructors
// -------

export const waitForApproval: Constructor<WaitForApproval> = p => {
  const { processId, challengeCommitment, channelId } = p;
  return { type: 'Responding.WaitForApproval', processId, channelId, challengeCommitment };
};

export const waitForTransaction: Constructor<WaitForTransaction> = p => {
  const { processId, transactionSubmissionState, channelId } = p;
  return {
    type: 'Responding.WaitForTransaction',
    transactionSubmissionState,
    processId,
    channelId,
  };
};

export const waitForAcknowledgement: Constructor<WaitForAcknowledgement> = p => {
  const { processId, channelId } = p;
  return { type: 'Responding.WaitForAcknowledgement', processId, channelId };
};

export const waitForResponse: Constructor<WaitForResponse> = p => {
  const { processId, channelId } = p;
  return { type: 'Responding.WaitForResponse', processId, channelId };
};

export const acknowledgeTimeout: Constructor<AcknowledgeTimeout> = p => {
  const { processId, channelId } = p;
  return { type: 'Responding.AcknowledgeTimeout', processId, channelId };
};

export const waitForDefund: Constructor<WaitForDefund> = p => {
  const { processId, defundingState, channelId } = p;
  return { type: 'Responding.WaitForDefund', processId, defundingState, channelId };
};

export const acknowledgeDefundingSuccess: Constructor<AcknowledgeDefundingSuccess> = p => {
  const { processId, channelId } = p;
  return { type: 'Responding.AcknowledgeDefundingSuccess', processId, channelId };
};

export const acknowledgeClosedButNotDefunded: Constructor<AcknowledgeClosedButNotDefunded> = p => {
  const { processId, channelId } = p;
  return { type: 'Responding.AcknowledgeClosedButNotDefunded', processId, channelId };
};

export const success: Constructor<Success> = p => {
  return { type: 'Responding.Success' };
};

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'Responding.Failure', reason };
};

export const closedAndDefunded: Constructor<ClosedAndDefunded> = p => {
  return { type: 'Responding.ClosedAndDefunded' };
};
export const closedButNotDefunded: Constructor<ClosedButNotDefunded> = p => {
  return { type: 'Responding.ClosedButNotDefunded' };
};

// -------
// Unions and Guards
// -------
export type ResponderState =
  | NonTerminalResponderState
  | Success
  | ClosedAndDefunded
  | ClosedButNotDefunded
  | Failure;

export type ResponderStateType = ResponderState['type'];

export type NonTerminalResponderState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForAcknowledgement
  | WaitForResponse
  | AcknowledgeTimeout
  | WaitForDefund
  | AcknowledgeDefundingSuccess
  | AcknowledgeClosedButNotDefunded;

export type TerminalResponderState = ClosedAndDefunded | ClosedButNotDefunded | Success;
export function isResponderState(state: ProtocolState): state is ResponderState {
  return (
    state.type === 'Responding.WaitForApproval' ||
    state.type === 'Responding.WaitForTransaction' ||
    state.type === 'Responding.WaitForAcknowledgement' ||
    state.type === 'Responding.WaitForResponse' ||
    state.type === 'Responding.AcknowledgeTimeout' ||
    state.type === 'Responding.WaitForDefund' ||
    state.type === 'Responding.AcknowledgeDefundingSuccess' ||
    state.type === 'Responding.AcknowledgeClosedButNotDefunded' ||
    state.type === 'Responding.Failure' ||
    state.type === 'Responding.ClosedAndDefunded' ||
    state.type === 'Responding.ClosedButNotDefunded' ||
    state.type === 'Responding.Success'
  );
}

export function isNonTerminalResponderState(
  state: ProtocolState,
): state is NonTerminalResponderState {
  return isResponderState(state) && !isTerminal(state);
}

export function isTerminal(state: ResponderState): state is TerminalResponderState {
  return (
    state.type === 'Responding.ClosedAndDefunded' ||
    state.type === 'Responding.Failure' ||
    state.type === 'Responding.Success' ||
    state.type === 'Responding.ClosedButNotDefunded'
  );
}
