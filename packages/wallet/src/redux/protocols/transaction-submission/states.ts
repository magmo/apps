import { TransactionRequest } from 'ethers/providers';
import { Properties as P } from '../../utils';

export type TransactionSubmissionState =
  | Start
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry
  | Success
  | Fail;

export interface Start {
  type: 'Start';
  transaction: TransactionRequest;
}

export interface WaitForSubmission {
  type: 'WaitForSubmission';
  transaction: TransactionRequest;
}

export interface WaitForConfirmation {
  type: 'WaitForConfirmation';
  transaction: TransactionRequest;
  transactionHash: string;
}

export interface ApproveRetry {
  type: 'ApproveRetry';
  transaction: TransactionRequest;
}

export interface Fail {
  type: 'Fail';
  reason: string;
}

export interface Success {
  type: 'Success';
}

// -------
// Helpers
// -------

export function isTerminal(state: TransactionSubmissionState): state is Fail | Success {
  return state.type === 'Fail' || state.type === 'Success';
}

// ------------
// Constructors
// ------------

export function start(p: P<Start>): Start {
  return { type: 'Start', transaction: p.transaction };
}

export function waitForSubmission(p: P<WaitForSubmission>): WaitForSubmission {
  return { type: 'WaitForSubmission', transaction: p.transaction };
}

export function approveRetry(p: P<ApproveRetry>): ApproveRetry {
  return { type: 'ApproveRetry', transaction: p.transaction };
}

export function waitForConfirmation(p: P<WaitForConfirmation>): WaitForConfirmation {
  const { transaction, transactionHash } = p;
  return { type: 'WaitForConfirmation', transaction, transactionHash };
}

export function success(): Success {
  return { type: 'Success' };
}
