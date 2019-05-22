import { WalletAction } from '../../actions';
import { ActionConstructor } from 'src/redux/utils';

// -------
// Actions
// -------

export interface TransactionSent {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SENT';
  processId: string;
}

export interface TransactionSubmissionFailed {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMISSION_FAILED';
  processId: string;
  error: { message?: string; code };
}

export interface TransactionSubmitted {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMITTED';
  processId: string;
  transactionHash: string;
}

export interface TransactionConfirmed {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_CONFIRMED';
  processId: string;
  contractAddress?: string;
}
export interface TransactionRetryApproved {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_APPROVED';
  processId: string;
}
export interface TransactionRetryDenied {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_DENIED';
  processId: string;
}

export interface TransactionFailed {
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_FAILED';
  processId: string;
}
// --------
// Constructors
// --------

export const transactionSent: ActionConstructor<TransactionSent> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SENT',
  processId: p.processId,
});

export const transactionSubmissionFailed: ActionConstructor<TransactionSubmissionFailed> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMISSION_FAILED',
  error: p.error,
  processId: p.processId,
});

export const transactionSubmitted: ActionConstructor<TransactionSubmitted> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMITTED',
  processId: p.processId,
  transactionHash: p.transactionHash,
});

export const transactionConfirmed: ActionConstructor<TransactionConfirmed> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_CONFIRMED',
  processId: p.processId,
  contractAddress: p.contractAddress,
});

export const transactionRetryApproved: ActionConstructor<TransactionRetryApproved> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_APPROVED',
  processId: p.processId,
});

export const transactionRetryDenied: ActionConstructor<TransactionRetryDenied> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_DENIED',
  processId: p.processId,
});

export const transactionFailed: ActionConstructor<TransactionFailed> = p => ({
  type: 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_FAILED',
  processId: p.processId,
});
// --------
// Unions and Guards
// --------

export type TransactionAction =
  | TransactionSent
  | TransactionSubmissionFailed
  | TransactionSubmitted
  | TransactionConfirmed
  | TransactionRetryApproved
  | TransactionRetryDenied
  | TransactionFailed;

export const isTransactionAction = (action: WalletAction): action is TransactionAction => {
  return (
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_CONFIRMED' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_FAILED' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_APPROVED' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_RETRY_DENIED' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SENT' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMISSION_FAILED' ||
    action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SUBMITTED'
  );
};
