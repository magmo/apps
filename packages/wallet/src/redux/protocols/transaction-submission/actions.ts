import { BaseProcessAction } from '../actions';

export type TransactionAction =
  | TransactionSentToMetamask
  | TransactionSubmissionFailed
  | TransactionSubmitted
  | TransactionConfirmed
  | RetryTransaction;

export const TRANSACTION_SENT_TO_METAMASK = 'WALLET.TRANSACTION_SENT_TO_METAMASK';
export const TRANSACTION_SUBMISSION_FAILED = 'WALLET.TRANSACTION_SUBMISSION_FAILED';
export const TRANSACTION_SUBMITTED = 'WALLET.TRANSACTION_SUBMITTED';
export const TRANSACTION_CONFIRMED = 'WALLET.TRANSACTION_CONFIRMED';
export const RETRY_TRANSACTION = 'WALLET.RETRY_TRANSACTION';
export const TRANSACTION_FINALIZED = 'WALLET.TRANSACTION_FINALIZED';

export interface TransactionSentToMetamask extends BaseProcessAction {
  type: typeof TRANSACTION_SENT_TO_METAMASK;
  processId: string;
  requestId: string;
}

export interface TransactionSubmissionFailed extends BaseProcessAction {
  type: typeof TRANSACTION_SUBMISSION_FAILED;
  requestId: string;
  processId: string;
  error: { message?: string; code };
}

export interface TransactionSubmitted extends BaseProcessAction {
  type: typeof TRANSACTION_SUBMITTED;
  requestId: string;
  processId: string;
  transactionHash: string;
}

export interface TransactionConfirmed extends BaseProcessAction {
  type: typeof TRANSACTION_CONFIRMED;
  requestId: string;
  processId: string;
  contractAddress?: string;
}

export interface TransactionFinalized extends BaseProcessAction {
  type: typeof TRANSACTION_FINALIZED;
  requestId: string;
  processId: string;
}

export interface RetryTransaction extends BaseProcessAction {
  type: typeof RETRY_TRANSACTION;
  requestId: string;
  processId: string;
}

// --------
// Creators
// --------

export const transactionSentToMetamask = (
  processId: string,
  requestId: string,
): TransactionSentToMetamask => ({
  type: TRANSACTION_SENT_TO_METAMASK,
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

export const retryTransaction = (requestId: string, processId: string): RetryTransaction => ({
  type: RETRY_TRANSACTION,
  requestId,
  processId,
});
