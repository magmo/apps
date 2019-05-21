import { NonTerminalTransactionSubmissionState } from '../../transaction-submission';
import { ProtocolState } from '../..';
import { DefundingState } from '../../defunding';
import { Constructor } from '../../../utils';

// -------
// States
// -------

export type FailureReason =
  | 'ChannelDoesntExist'
  | 'NotFullyOpen'
  | 'DeclinedByUser'
  | 'AlreadyHaveLatest'
  | 'LatestWhileApproving'
  | 'TransactionFailed';

export interface ApproveChallenge {
  type: 'Challenging.ApproveChallenge';
  processId: string;
  channelId: string;
}

export interface WaitForTransaction {
  type: 'Challenging.WaitForTransaction';
  processId: string;
  channelId: string;
  expiryTime?: number;
  transactionSubmission: NonTerminalTransactionSubmissionState;
}

export interface WaitForResponseOrTimeout {
  type: 'Challenging.WaitForResponseOrTimeout';
  processId: string;
  channelId: string;
  expiryTime: number;
}

export interface AcknowledgeTimeout {
  type: 'Challenging.AcknowledgeTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeFailure {
  type: 'Challenging.AcknowledgeFailure';
  processId: string;
  channelId: string;
  reason: FailureReason;
}
export interface AcknowledgeResponse {
  type: 'Challenging.AcknowledgeResponse';
  processId: string;
  channelId: string;
}

export interface WaitForDefund {
  type: 'Challenging.WaitForDefund';
  processId: string;
  channelId: string;
  defundingState: DefundingState;
}

export interface AcknowledgeClosedButNotDefunded {
  type: 'Challenging.AcknowledgeClosedButNotDefunded';
  processId: string;
  channelId: string;
}

export interface AcknowledgeSuccess {
  type: 'Challenging.AcknowledgeSuccess';
  processId: string;
  channelId: string;
}
export interface Failure {
  type: 'Challenging.Failure';
  reason: FailureReason;
}

export interface SuccessOpen {
  type: 'Challenging.SuccessOpen';
}

export interface SuccessClosedAndDefunded {
  type: 'Challenging.SuccessClosedAndDefunded';
}

export interface SuccessClosedButNotDefunded {
  type: 'Challenging.SuccessClosedButNotDefunded';
}

// ------------
// Constructors
// ------------

export const approveChallenge: Constructor<ApproveChallenge> = p => {
  const { processId, channelId } = p;
  return { type: 'Challenging.ApproveChallenge', processId, channelId };
};

export const waitForTransaction: Constructor<WaitForTransaction> = p => {
  const { processId, channelId, transactionSubmission, expiryTime } = p;
  return {
    type: 'Challenging.WaitForTransaction',
    processId,
    channelId,
    transactionSubmission,
    expiryTime,
  };
};

export const waitForResponseOrTimeout: Constructor<WaitForResponseOrTimeout> = p => {
  const { processId, channelId, expiryTime } = p;
  return { type: 'Challenging.WaitForResponseOrTimeout', processId, channelId, expiryTime };
};

export const acknowledgeResponse: Constructor<AcknowledgeResponse> = p => {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeResponse', processId, channelId };
};

export const acknowledgeTimeout: Constructor<AcknowledgeTimeout> = p => {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeTimeout', processId, channelId };
};

export const acknowledgeFailure: Constructor<AcknowledgeFailure> = p => {
  const { processId, channelId, reason } = p;
  return { type: 'Challenging.AcknowledgeFailure', processId, channelId, reason };
};

export const waitForDefund: Constructor<WaitForDefund> = p => {
  const { processId, channelId, defundingState } = p;
  return { type: 'Challenging.WaitForDefund', processId, channelId, defundingState };
};

export const acknowledgeClosedButNotDefunded: Constructor<AcknowledgeClosedButNotDefunded> = p => {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeClosedButNotDefunded', processId, channelId };
};

export const acknowledgeSuccess: Constructor<AcknowledgeSuccess> = p => {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeSuccess', processId, channelId };
};

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'Challenging.Failure', reason };
};

export const successClosedAndDefunded: Constructor<SuccessClosedAndDefunded> = p => {
  return { type: 'Challenging.SuccessClosedAndDefunded' };
};

export const successClosedButNotDefunded: Constructor<SuccessClosedButNotDefunded> = p => {
  return { type: 'Challenging.SuccessClosedButNotDefunded' };
};

export const successOpen: Constructor<SuccessOpen> = p => {
  return { type: 'Challenging.SuccessOpen' };
};

// -------
// Unions and Guards
// -------

export type ChallengerState = NonTerminalChallengerState | TerminalChallengerState;
export type ChallengerStateType = ChallengerState['type'];

export type NonTerminalChallengerState =
  | ApproveChallenge
  | WaitForTransaction
  | WaitForResponseOrTimeout
  | AcknowledgeTimeout
  | AcknowledgeResponse
  | AcknowledgeFailure
  | WaitForDefund
  | AcknowledgeClosedButNotDefunded
  | AcknowledgeSuccess;

export type TerminalChallengerState =
  | SuccessOpen
  | SuccessClosedAndDefunded
  | SuccessClosedButNotDefunded
  | Failure;

export function isNonTerminalChallengerState(
  state: ProtocolState,
): state is NonTerminalChallengerState {
  return isChallengerState(state) && isNonTerminal(state);
}

export function isChallengerState(state: ProtocolState): state is ChallengerState {
  return (
    state.type === 'Challenging.ApproveChallenge' ||
    state.type === 'Challenging.WaitForTransaction' ||
    state.type === 'Challenging.WaitForResponseOrTimeout' ||
    state.type === 'Challenging.AcknowledgeTimeout' ||
    state.type === 'Challenging.AcknowledgeFailure' ||
    state.type === 'Challenging.AcknowledgeResponse' ||
    state.type === 'Challenging.Failure' ||
    state.type === 'Challenging.SuccessOpen' ||
    state.type === 'Challenging.SuccessClosedAndDefunded' ||
    state.type === 'Challenging.SuccessClosedButNotDefunded' ||
    state.type === 'Challenging.WaitForDefund' ||
    state.type === 'Challenging.AcknowledgeSuccess' ||
    state.type === 'Challenging.AcknowledgeClosedButNotDefunded'
  );
}

export function isTerminal(state: ChallengerState): state is TerminalChallengerState {
  return (
    state.type === 'Challenging.Failure' ||
    state.type === 'Challenging.SuccessOpen' ||
    state.type === 'Challenging.SuccessClosedAndDefunded' ||
    state.type === 'Challenging.SuccessClosedButNotDefunded'
  );
}

export function isNonTerminal(state: ChallengerState): state is NonTerminalChallengerState {
  return !isTerminal(state);
}
