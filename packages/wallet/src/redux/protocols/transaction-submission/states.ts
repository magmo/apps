import { Properties as P } from '../../utils';
import { TransactionRequest } from 'ethers/providers';

export type TransactionSubmissionState =
  | Start
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry
  | Success
  | Fail;

export const START = 'Start';
export const WAIT_FOR_SUBMISSION = 'WaitForSubmission';
export const WAIT_FOR_CONFIRMATION = 'WaitForConfirmation';
export const APPROVE_RETRY = 'ApproveRetry';
export const FAIL = 'Fail';
export const SUCCESS = 'Success';

export interface Start {
  type: typeof START;
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

export interface Fail {
  type: typeof FAIL;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

// -------
// Helpers
// -------

export function isTerminal(state: TransactionSubmissionState): state is Fail | Success {
  return state.type === FAIL || state.type === SUCCESS;
}

// ------------
// Constructors
// ------------

export function start(p: P<Start>): Start {
  const { transaction, processId, requestId } = p;
  return { type: START, transaction, processId, requestId };
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
