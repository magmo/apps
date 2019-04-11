import { TransactionRequest } from 'ethers/providers';

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
