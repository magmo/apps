import { TransactionSubmissionState } from '../transaction-submission/states';
import { Properties } from '../../utils';
export type WithdrawalState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForAcknowledgement
  | Failure
  | Success;

export const WAIT_FOR_APPROVAL = 'WaitforApproval';
export const WAIT_FOR_TRANSACTION = 'WaitForTransaction';
export const WAIT_FOR_ACKNOWLEDGEMENT = 'WaitForAcknowledgement';
export const SUCCESS = 'Success';
export const REJECTED = 'Rejected';
export const FAILURE = 'Failure';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  processId: string;
  channelId: string;
  withdrawalAmount: string;
}

export interface WaitForTransaction {
  type: typeof WAIT_FOR_TRANSACTION;
  processId: string;
  channelId: string;
  transactionSubmissionState: TransactionSubmissionState;
  withdrawalAddress: string;
}

export interface WaitForAcknowledgement {
  type: typeof WAIT_FOR_ACKNOWLEDGEMENT;
  processId: string;
  channelId: string;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

// -------
// Helpers
// -------

export function isTerminal(state: WithdrawalState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

export function waitForApproval(properties: Properties<WaitForApproval>): WaitForApproval {
  const { processId, withdrawalAmount, channelId } = properties;
  return { type: WAIT_FOR_APPROVAL, withdrawalAmount, processId, channelId };
}

export function waitForTransaction(properties: Properties<WaitForTransaction>): WaitForTransaction {
  const { processId, transactionSubmissionState, channelId, withdrawalAddress } = properties;
  return {
    type: WAIT_FOR_TRANSACTION,
    transactionSubmissionState,
    processId,
    channelId,
    withdrawalAddress,
  };
}

export function waitForAcknowledgement(
  properties: Properties<WaitForAcknowledgement>,
): WaitForAcknowledgement {
  const { processId, channelId } = properties;
  return { type: WAIT_FOR_ACKNOWLEDGEMENT, processId, channelId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}

export const FAILURE_REASONS = {
  TRANSACTION_FAILURE: 'Transaction failed',
  CHANNEL_NOT_CLOSED: 'Channel not closed',
  USER_REJECTED: 'User rejected',
};
