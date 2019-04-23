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
}

export interface WaitForSubmission {
  type: typeof WAIT_FOR_SUBMISSION;
  transaction: TransactionRequest;
  processId: string;
}

export interface WaitForConfirmation {
  type: typeof WAIT_FOR_CONFIRMATION;
  transaction: TransactionRequest;
  transactionHash: string;
  processId: string;
}

export interface ApproveRetry {
  type: typeof APPROVE_RETRY;
  transaction: TransactionRequest;
  processId: string;
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

export function isSuccess(state: TransactionSubmissionState): state is Success {
  return state.type === SUCCESS;
}

export function isFailure(state: TransactionSubmissionState): state is Failure {
  return state.type === FAILURE;
}

// ------------
// Constructors
// ------------

type Constructor<T> = (p: P<T>) => T;

export const waitForSend: Constructor<WaitForSend> = p => {
  const { transaction, processId } = p;
  return { type: WAIT_FOR_SEND, transaction, processId };
};

export const waitForSubmission: Constructor<WaitForSubmission> = p => {
  const { transaction, processId } = p;
  return { type: WAIT_FOR_SUBMISSION, transaction, processId };
};

export const approveRetry: Constructor<ApproveRetry> = p => {
  const { transaction, processId } = p;
  return { type: APPROVE_RETRY, transaction, processId };
};

export const waitForConfirmation: Constructor<WaitForConfirmation> = p => {
  const { transaction, transactionHash, processId } = p;
  return { type: WAIT_FOR_CONFIRMATION, transaction, transactionHash, processId };
};

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}
