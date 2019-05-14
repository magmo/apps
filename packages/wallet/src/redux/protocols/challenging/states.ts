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
  | AcknowledgeFailure;

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
  transactionSubmission: NonTerminalTransactionSubmissionState;
}

export interface WaitForResponseOrTimeout {
  type: 'Challenging.WaitForResponseOrTimeout';
  processId: string;
  channelId: string;
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
  const { processId, channelId, transactionSubmission } = p;
  return { type: 'Challenging.WaitForTransaction', processId, channelId, transactionSubmission };
}

export function waitForResponseOrTimeout(p: P<WaitForResponseOrTimeout>): WaitForResponseOrTimeout {
  const { processId, channelId } = p;
  return { type: 'Challenging.WaitForResponseOrTimeout', processId, channelId };
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
