import { Properties as P } from '../../utils';
import { TransactionRequest } from 'ethers/providers';

export type TransactionSubmissionState =
  | WaitForSend
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry
  | Success
  | Failure;

export const WAIT_FOR_SEND = 'WaitForSend';
export const WAIT_FOR_SUBMISSION = 'WaitForSubmission';
export const WAIT_FOR_CONFIRMATION = 'WaitForConfirmation';
export const APPROVE_RETRY = 'ApproveRetry';
export const FAILURE = 'Failure';
export const SUCCESS = 'Success';

export interface WaitForSend {
  type: typeof WAIT_FOR_SEND;
  transaction: TransactionRequest;
  processId: string;
  requestId: string;
}

export interface WaitForSubmission {
  type: typeof WAIT_FOR_SUBMISSION;
  transaction: TransactionRequest;
  processId: string;
  requestId: string;
}

export interface WaitForConfirmation {
  type: typeof WAIT_FOR_CONFIRMATION;
  transaction: TransactionRequest;
  transactionHash: string;
  processId: string;
  requestId: string;
}

export interface ApproveRetry {
  type: typeof APPROVE_RETRY;
  transaction: TransactionRequest;
  processId: string;
  requestId: string;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

// -------
// Helpers
// -------

export function isTerminal(state: TransactionSubmissionState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

// ------------
// Constructors
// ------------

export function waitForSend(p: P<WaitForSend>): WaitForSend {
  const { transaction, processId, requestId } = p;
  return { type: WAIT_FOR_SEND, transaction, processId, requestId };
}

export function waitForSubmission(p: P<WaitForSubmission>): WaitForSubmission {
  const { transaction, requestId, processId } = p;
  return { type: WAIT_FOR_SUBMISSION, transaction, processId, requestId };
}

export function approveRetry(p: P<ApproveRetry>): ApproveRetry {
  const { transaction, processId, requestId } = p;
  return { type: APPROVE_RETRY, transaction, processId, requestId };
}

export function waitForConfirmation(p: P<WaitForConfirmation>): WaitForConfirmation {
  const { transaction, transactionHash, processId, requestId } = p;
  return { type: WAIT_FOR_CONFIRMATION, transaction, transactionHash, processId, requestId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}
