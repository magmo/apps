import { TransactionRequest } from 'ethers/providers';

export type TransactionSubmission =
  | Start
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry
  | Success
  | Fail;

export interface Start {
  type: 'Start';
  transactionRequest: TransactionRequest;
}

export interface WaitForSubmission {
  type: 'WaitForSubmission';
  transactionRequest: TransactionRequest;
}

export interface WaitForConfirmation {
  type: 'WaitForConfirmation';
  transactionRequest: TransactionRequest;
  transactionHash: string;
}

export interface ApproveRetry {
  type: 'ApproveRetry';
  transactionRequest: TransactionRequest;
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

export function isTerminal(state: TransactionSubmission): state is Fail | Success {
  return state.type === 'Fail' || state.type === 'Success';
}
