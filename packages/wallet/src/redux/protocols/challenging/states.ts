import { Properties as P } from '../../utils';
import { TransactionSubmissionState } from '../transaction-submission';

export type ChallengingState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForResponseOrTimeout
  | AcknowledgeTimeout
  | AcknowledgeResponse
  | Unnecessary
  | SuccessOpen
  | SuccessClosed
  | Failure;

export interface WaitForApproval {
  type: 'WaitForApproval';
  processId: string;
  channelId: string;
}

export interface WaitForTransaction {
  type: 'WaitForTransaction';
  processId: string;
  channelId: string;
  transactionSubmission: TransactionSubmissionState;
}

export interface WaitForResponseOrTimeout {
  type: 'WaitForResponseOrTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeTimeout {
  type: 'AcknowledgeTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeFailure {
  type: 'AcknowledgeFailure';
  processId: string;
  channelId: string;
}

export interface AcknowledgeUnnecessary {
  type: 'AcknowledgeUnnecessary';
  processId: string;
  channelId: string;
}

export interface AcknowledgeResponse {
  type: 'AcknowledgeResponse';
  processId: string;
  channelId: string;
}

export interface Failure {
  type: 'Failure';
}

export interface Unnecessary {
  type: 'Unnecessary';
}

export interface SuccessOpen {
  type: 'SuccessOpen';
}

export interface SuccessClosed {
  type: 'SuccessClosed';
}

// --------
// Creators
// --------

export function waitForApproval(p: P<WaitForApproval>): WaitForApproval {
  const { processId, channelId } = p;
  return { type: 'WaitForApproval', processId, channelId };
}

export function waitForTransaction(p: P<WaitForTransaction>): WaitForTransaction {
  const { processId, channelId, transactionSubmission } = p;
  return { type: 'WaitForTransaction', processId, channelId, transactionSubmission };
}

export function waitForResponseOrTimeout(p: P<WaitForResponseOrTimeout>): WaitForResponseOrTimeout {
  const { processId, channelId } = p;
  return { type: 'WaitForResponseOrTimeout', processId, channelId };
}

export function acknowledgeResponse(p: P<AcknowledgeResponse>): AcknowledgeResponse {
  const { processId, channelId } = p;
  return { type: 'AcknowledgeResponse', processId, channelId };
}

export function acknowledgeTimeout(p: P<AcknowledgeTimeout>): AcknowledgeTimeout {
  const { processId, channelId } = p;
  return { type: 'AcknowledgeTimeout', processId, channelId };
}

export function acknowledgeUnnecessary(p: P<AcknowledgeUnnecessary>): AcknowledgeUnnecessary {
  const { processId, channelId } = p;
  return { type: 'AcknowledgeUnnecessary', processId, channelId };
}

export function acknowledgeFailure(p: P<AcknowledgeFailure>): AcknowledgeFailure {
  const { processId, channelId } = p;
  return { type: 'AcknowledgeFailure', processId, channelId };
}

export function failure(): Failure {
  return { type: 'Failure' };
}

export function unnecessary(): Unnecessary {
  return { type: 'Unnecessary' };
}

export function successClosed(): SuccessClosed {
  return { type: 'SuccessClosed' };
}

export function successOpen(): SuccessOpen {
  return { type: 'SuccessOpen' };
}
