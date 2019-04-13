import { BaseProcessAction } from '../actions';

export type TransactionAction =
  | TransactionSent
  | TransactionSubmissionFailed
  | TransactionSubmitted
  | TransactionConfirmed
  | TransactionRetryApproved
  | TransactionRetryDenied
  | TransactionFailed;

export const TRANSACTION_SENT = 'WALLET.TRANSACTION_SENT';
export const TRANSACTION_SUBMITTED = 'WALLET.TRANSACTION_SUBMITTED';
export const TRANSACTION_SUBMISSION_FAILED = 'WALLET.TRANSACTION_SUBMISSION_FAILED';
export const TRANSACTION_CONFIRMED = 'WALLET.TRANSACTION_CONFIRMED';
export const TRANSACTION_FAILED = 'WALLET.TRANSACTION_FAILED';
export const TRANSACTION_RETRY_APPROVED = 'WALLET.TRANSACTION_RETRY_APPROVED';
export const TRANSACTION_RETRY_DENIED = 'WALLET.TRANSACTION_RETRY_DENIED';
export const TRANSACTION_FINALIZED = 'WALLET.TRANSACTION_FINALIZED'; // currently unused

export interface TransactionSent {
  type: typeof TRANSACTION_SENT;
  processId: string;
  requestId: string;
}

export interface TransactionSubmissionFailed extends BaseProcessAction {
  type: typeof TRANSACTION_SUBMISSION_FAILED;
  processId: string;
  requestId: string;
  error: { message?: string; code };
}

export interface TransactionSubmitted extends BaseProcessAction {
  type: typeof TRANSACTION_SUBMITTED;
  processId: string;
  requestId: string;
  transactionHash: string;
}

export interface TransactionConfirmed extends BaseProcessAction {
  type: typeof TRANSACTION_CONFIRMED;
  processId: string;
  requestId: string;
  contractAddress?: string;
}

export interface TransactionFinalized extends BaseProcessAction {
  type: typeof TRANSACTION_FINALIZED;
  processId: string;
  requestId: string;
}

export interface TransactionRetryApproved {
  type: typeof TRANSACTION_RETRY_APPROVED;
  requestId: string;
  processId: string;
}
export interface TransactionRetryDenied {
  type: typeof TRANSACTION_RETRY_DENIED;
  requestId: string;
  processId: string;
}

export interface TransactionFailed {
  type: typeof TRANSACTION_FAILED;
  requestId: string;
  processId: string;
}

// --------
// Creators
// --------

export const transactionSent = (processId: string, requestId: string): TransactionSent => ({
  type: TRANSACTION_SENT,
  processId,
  requestId,
});

export const transactionSubmissionFailed = (
  processId: string,
  requestId: string,
  error: { message?: string; code },
): TransactionSubmissionFailed => ({
  type: TRANSACTION_SUBMISSION_FAILED,
  error,
  requestId,
  processId,
});

export const transactionSubmitted = (
  processId: string,
  requestId: string,
  transactionHash: string,
): TransactionSubmitted => ({
  type: TRANSACTION_SUBMITTED,
  requestId,
  processId,
  transactionHash,
});

export const transactionConfirmed = (
  processId: string,
  requestId: string,
  contractAddress?: string,
): TransactionConfirmed => ({
  type: TRANSACTION_CONFIRMED,
  requestId,
  processId,
  contractAddress,
});

export const transactionFinalized = (
  processId: string,
  requestId: string,
): TransactionFinalized => ({
  type: TRANSACTION_FINALIZED,
  requestId,
  processId,
});

export const transactionRetryApproved = (
  processId: string,
  requestId: string,
): TransactionRetryApproved => ({
  type: TRANSACTION_RETRY_APPROVED,
  requestId,
  processId,
});

export const transactionRetryDenied = (
  processId: string,
  requestId: string,
): TransactionRetryDenied => ({
  type: TRANSACTION_RETRY_DENIED,
  requestId,
  processId,
});

export const transactionFailed = (processId: string, requestId: string): TransactionFailed => ({
  type: TRANSACTION_FAILED,
  requestId,
  processId,
});
