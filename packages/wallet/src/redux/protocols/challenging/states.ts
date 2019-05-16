import { Properties as P } from '../../utils';
import { NonTerminalTransactionSubmissionState } from '../transaction-submission';
import { ProtocolState } from '..';

export type ChallengingState = NonTerminalState | TerminalState;
export type ChallengingStateType = ChallengingState['type'];

export type NonTerminalState =
  | ApproveChallenge
  | WaitForTransaction
  | WaitForResponseOrTimeout
  | AcknowledgeTimeout
  | AcknowledgeResponse
  | AcknowledgeFailure
  | WaitForDefund
  | AcknowledgeClosedButNotDefunded
  | AcknowledgeSuccess;

export type TerminalState = SuccessOpen | SuccessClosed | Failure;

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

export interface SuccessClosed {
  type: 'Challenging.SuccessClosed';
}

// -------
// Helpers
// -------

export function isNonTerminalChallengingState(state: ProtocolState): state is NonTerminalState {
  return isChallengingState(state) && isNonTerminal(state);
}

export function isChallengingState(state: ProtocolState): state is ChallengingState {
  return (
    state.type === 'Challenging.ApproveChallenge' ||
    state.type === 'Challenging.WaitForTransaction' ||
    state.type === 'Challenging.WaitForResponseOrTimeout' ||
    state.type === 'Challenging.AcknowledgeTimeout' ||
    state.type === 'Challenging.AcknowledgeFailure' ||
    state.type === 'Challenging.AcknowledgeResponse' ||
    state.type === 'Challenging.Failure' ||
    state.type === 'Challenging.SuccessOpen' ||
    state.type === 'Challenging.SuccessClosed'
  );
}

export function isTerminal(state: ChallengingState): state is TerminalState {
  return (
    state.type === 'Challenging.Failure' ||
    state.type === 'Challenging.SuccessOpen' ||
    state.type === 'Challenging.SuccessClosed'
  );
}

export function isNonTerminal(state: ChallengingState): state is NonTerminalState {
  return !isTerminal(state);
}
// --------
// Creators
// --------

export function approveChallenge(p: P<ApproveChallenge>): ApproveChallenge {
  const { processId, channelId } = p;
  return { type: 'Challenging.ApproveChallenge', processId, channelId };
}

export function waitForTransaction(p: P<WaitForTransaction>): WaitForTransaction {
  const { processId, channelId, transactionSubmission, expiryTime } = p;
  return {
    type: 'Challenging.WaitForTransaction',
    processId,
    channelId,
    transactionSubmission,
    expiryTime,
  };
}

export function waitForResponseOrTimeout(p: P<WaitForResponseOrTimeout>): WaitForResponseOrTimeout {
  const { processId, channelId, expiryTime } = p;
  return { type: 'Challenging.WaitForResponseOrTimeout', processId, channelId, expiryTime };
}

export function acknowledgeResponse(p: P<AcknowledgeResponse>): AcknowledgeResponse {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeResponse', processId, channelId };
}

export function acknowledgeTimeout(p: P<AcknowledgeTimeout>): AcknowledgeTimeout {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeTimeout', processId, channelId };
}

export function acknowledgeFailure(p: P<AcknowledgeFailure>): AcknowledgeFailure {
  const { processId, channelId, reason } = p;
  return { type: 'Challenging.AcknowledgeFailure', processId, channelId, reason };
}

export function waitForDefund(p: P<WaitForDefund>): WaitForDefund {
  const { processId, channelId } = p;
  return { type: 'Challenging.WaitForDefund', processId, channelId };
}

export function AcknowledgeClosedButNotDefunded(
  p: P<AcknowledgeClosedButNotDefunded>,
): AcknowledgeClosedButNotDefunded {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeClosedButNotDefunded', processId, channelId };
}

export function acknowledgeSuccess(p: P<AcknowledgeSuccess>): AcknowledgeSuccess {
  const { processId, channelId } = p;
  return { type: 'Challenging.AcknowledgeSuccess', processId, channelId };
}

export function failure(p: P<Failure>): Failure {
  const { reason } = p;
  return { type: 'Challenging.Failure', reason };
}

export function successClosed(): SuccessClosed {
  return { type: 'Challenging.SuccessClosed' };
}

export function successOpen(): SuccessOpen {
  return { type: 'Challenging.SuccessOpen' };
}
