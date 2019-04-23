import { Properties as P } from '../../utils';
import { TransactionRequest } from 'ethers/providers';

export type TransactionSubmissionState = NonTerminalTransactionSubmissionState | Success | Failure;

export type NonTerminalTransactionSubmissionState =
  | WaitForSend
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry;

export interface WaitForSend {
  type: 'WaitForSend';
  transaction: TransactionRequest;
  processId: string;
}

export interface WaitForSubmission {
  type: 'WaitForSubmission';
  transaction: TransactionRequest;
  processId: string;
}

export interface WaitForConfirmation {
  type: 'WaitForConfirmation';
  transaction: TransactionRequest;
  transactionHash: string;
  processId: string;
}

export interface ApproveRetry {
  type: 'ApproveRetry';
  transaction: TransactionRequest;
  processId: string;
}

export interface Failure {
  type: 'Failure';
  reason: string;
}

export interface Success {
  type: 'Success';
}

// -------
// Helpers
// -------

export function isTerminal(state: TransactionSubmissionState): state is Failure | Success {
  return state.type === 'Failure' || state.type === 'Success';
}

export function isSuccess(state: TransactionSubmissionState): state is Success {
  return state.type === 'Success';
}

export function isFailure(state: TransactionSubmissionState): state is Failure {
  return state.type === 'Failure';
}

// ------------
// Constructors
// ------------

type Constructor<T> = (p: P<T>) => T;

export const waitForSend: Constructor<WaitForSend> = p => {
  const { transaction, processId } = p;
  return { type: 'WaitForSend', transaction, processId };
};

export const waitForSubmission: Constructor<WaitForSubmission> = p => {
  const { transaction, processId } = p;
  return { type: 'WaitForSubmission', transaction, processId };
};

export const approveRetry: Constructor<ApproveRetry> = p => {
  const { transaction, processId } = p;
  return { type: 'ApproveRetry', transaction, processId };
};

export const waitForConfirmation: Constructor<WaitForConfirmation> = p => {
  const { transaction, transactionHash, processId } = p;
  return { type: 'WaitForConfirmation', transaction, transactionHash, processId };
};

export function success(): Success {
  return { type: 'Success' };
}

export function failure(reason: string): Failure {
  return { type: 'Failure', reason };
}
