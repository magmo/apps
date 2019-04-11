import { WalletProtocol } from '../../types';
import { ProcessAction } from '../actions';

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

export interface TransactionSentToMetamask extends ProcessAction {
  type: typeof TRANSACTION_SENT_TO_METAMASK;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
}
export interface TransactionSubmissionFailed extends ProcessAction {
  type: typeof TRANSACTION_SUBMISSION_FAILED;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
  error: { message?: string; code };
}

export interface TransactionSubmitted extends ProcessAction {
  type: typeof TRANSACTION_SUBMITTED;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
  transactionHash: string;
}

export interface TransactionConfirmed extends ProcessAction {
  type: typeof TRANSACTION_CONFIRMED;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
  contractAddress?: string;
}

export interface TransactionFinalized extends ProcessAction {
  type: typeof TRANSACTION_FINALIZED;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
}

export interface RetryTransaction extends ProcessAction {
  type: typeof RETRY_TRANSACTION;
  protocol: WalletProtocol.TransactionSubmission;
  channelId: string;
  processId: string;
}

// --------
// Creators
// --------

export const transactionSentToMetamask = (
  channelId: string,
  processId: string,
): TransactionSentToMetamask => ({
  type: TRANSACTION_SENT_TO_METAMASK,
  protocol: WalletProtocol.TransactionSubmission,
  channelId,
  processId,
});

export const transactionSubmissionFailed = (
  channelId: string,
  processId: string,
  error: { message?: string; code },
): TransactionSubmissionFailed => ({
  type: TRANSACTION_SUBMISSION_FAILED,
  protocol: WalletProtocol.TransactionSubmission,
  error,
  channelId,
  processId,
});

export const transactionSubmitted = (
  channelId: string,
  processId: string,
  transactionHash: string,
): TransactionSubmitted => ({
  type: TRANSACTION_SUBMITTED,
  protocol: WalletProtocol.TransactionSubmission,
  channelId,
  processId,
  transactionHash,
});

export const transactionConfirmed = (
  channelId: string,
  processId: string,
  contractAddress?: string,
): TransactionConfirmed => ({
  type: TRANSACTION_CONFIRMED,
  protocol: WalletProtocol.TransactionSubmission,

  channelId,
  processId,
  contractAddress,
});

export const transactionFinalized = (
  channelId: string,
  processId: string,
): TransactionFinalized => ({
  type: TRANSACTION_FINALIZED,
  protocol: WalletProtocol.TransactionSubmission,
  channelId,
  processId,
});

export const retryTransaction = (channelId: string, processId: string): RetryTransaction => ({
  type: RETRY_TRANSACTION,
  protocol: WalletProtocol.TransactionSubmission,
  channelId,
  processId,
});
