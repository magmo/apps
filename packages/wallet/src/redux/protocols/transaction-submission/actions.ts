export type TransactionAction =
  | TransactionSentToMetamask
  | TransactionSubmissionFailed
  | TransactionSubmitted
  | TransactionConfirmed
  | TransactionFinalized
  | RetryTransaction;

export const TRANSACTION_SENT_TO_METAMASK = 'WALLET.COMMON.TRANSACTION_SENT_TO_METAMASK';
export const transactionSentToMetamask = (channelId: string, processId: string) => ({
  type: TRANSACTION_SENT_TO_METAMASK as typeof TRANSACTION_SENT_TO_METAMASK,
  channelId,
  processId,
});
export type TransactionSentToMetamask = ReturnType<typeof transactionSentToMetamask>;

export const TRANSACTION_SUBMISSION_FAILED = 'WALLET.COMMON.TRANSACTION_SUBMISSION_FAILED';
export const transactionSubmissionFailed = (
  channelId: string,
  processId: string,
  error: { message?: string; code },
) => ({
  error,
  channelId,
  processId,
  type: TRANSACTION_SUBMISSION_FAILED as typeof TRANSACTION_SUBMISSION_FAILED,
});
export type TransactionSubmissionFailed = ReturnType<typeof transactionSubmissionFailed>;

export const TRANSACTION_SUBMITTED = 'WALLET.COMMON.TRANSACTION_SUBMITTED';
export const transactionSubmitted = (
  channelId: string,
  processId: string,
  transactionHash: string,
) => ({
  channelId,
  processId,
  transactionHash,
  type: TRANSACTION_SUBMITTED as typeof TRANSACTION_SUBMITTED,
});
export type TransactionSubmitted = ReturnType<typeof transactionSubmitted>;

export const TRANSACTION_CONFIRMED = 'WALLET.COMMON.TRANSACTION_CONFIRMED';
export const transactionConfirmed = (
  channelId: string,
  processId: string,
  contractAddress?: string,
) => ({
  channelId,
  processId,
  contractAddress,
  type: TRANSACTION_CONFIRMED as typeof TRANSACTION_CONFIRMED,
});
export type TransactionConfirmed = ReturnType<typeof transactionConfirmed>;

export const TRANSACTION_FINALIZED = 'WALLET.COMMON.TRANSACTION_FINALIZED';
export const transactionFinalized = (channelId: string, processId: string) => ({
  channelId,
  processId,
  type: TRANSACTION_FINALIZED as typeof TRANSACTION_FINALIZED,
});
export type TransactionFinalized = ReturnType<typeof transactionFinalized>;

export const RETRY_TRANSACTION = 'WALLET.COMMON.RETRY_TRANSACTION';
export const retryTransaction = (channelId: string, processId: string) => ({
  type: RETRY_TRANSACTION as typeof RETRY_TRANSACTION,
  channelId,
  processId,
});
export type RetryTransaction = ReturnType<typeof retryTransaction>;
