import { Properties as Prop } from '../../utils';

export type TransactionAction =
  | TransactionSentToMetamask
  | TransactionSubmissionFailed
  | TransactionSubmitted
  | TransactionConfirmed
  | RetryTransaction;

export const TRANSACTION_SENT_TO_METAMASK = 'WALLET.COMMON.TRANSACTION_SENT_TO_METAMASK';
export const TRANSACTION_SUBMISSION_FAILED = 'WALLET.COMMON.TRANSACTION_SUBMISSION_FAILED';
export const TRANSACTION_SUBMITTED = 'WALLET.COMMON.TRANSACTION_SUBMITTED';
export const TRANSACTION_CONFIRMED = 'WALLET.COMMON.TRANSACTION_CONFIRMED';
export const RETRY_TRANSACTION = 'WALLET.COMMON.RETRY_TRANSACTION';

export interface TransactionSentToMetamask {
  type: typeof TRANSACTION_SENT_TO_METAMASK;
  channelId: string;
  processId: string;
}
export interface TransactionSubmissionFailed {
  type: typeof TRANSACTION_SUBMISSION_FAILED;
  channelId: string;
  processId: string;
  error: { message?: string; code };
}

export interface TransactionSubmitted {
  type: typeof TRANSACTION_SUBMITTED;
  channelId: string;
  processId: string;
  transactionHash: string;
}

export interface TransactionConfirmed {
  type: typeof TRANSACTION_CONFIRMED;
  channelId: string;
  processId: string;
  contractAddress?: string;
}

export interface RetryTransaction {
  type: typeof RETRY_TRANSACTION;
  channelId: string;
  processId: string;
}

// --------
// Creators
// --------

export const transactionSentToMetamask = (
  p: Prop<TransactionSentToMetamask>,
): TransactionSentToMetamask => ({
  type: TRANSACTION_SENT_TO_METAMASK,
  channelId: p.channelId,
  processId: p.processId,
});

export const transactionSubmissionFailed = (
  p: Prop<TransactionSubmissionFailed>,
): TransactionSubmissionFailed => ({
  type: TRANSACTION_SUBMISSION_FAILED,
  error: p.error,
  channelId: p.channelId,
  processId: p.processId,
});

export const transactionSubmitted = (p: Prop<TransactionSubmitted>): TransactionSubmitted => ({
  type: TRANSACTION_SUBMITTED,
  channelId: p.channelId,
  processId: p.processId,
  transactionHash: p.transactionHash,
});

export const transactionConfirmed = (p: Prop<TransactionConfirmed>): TransactionConfirmed => ({
  type: TRANSACTION_CONFIRMED,
  channelId: p.channelId,
  processId: p.processId,
  contractAddress: p.contractAddress,
});

export const retryTransaction = (p: Prop<RetryTransaction>): RetryTransaction => ({
  type: RETRY_TRANSACTION,
  channelId: p.channelId,
  processId: p.processId,
});
