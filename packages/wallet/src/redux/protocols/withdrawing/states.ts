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
  withdrawalAmount: string;
}

export interface WaitForTransaction {
  type: typeof WAIT_FOR_TRANSACTION;
  processId: string;
  transactionSubmissionState: TransactionSubmissionState;
}

export interface WaitForAcknowledgement {
  type: typeof WAIT_FOR_ACKNOWLEDGEMENT;
  processId: string;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

// -------
// Helpers
// -------

export function isTerminal(state: WithdrawalState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

export function waitforApproval(properties: Properties<WaitForApproval>): WaitForApproval {
  const { processId, withdrawalAmount } = properties;
  return { type: WAIT_FOR_APPROVAL, withdrawalAmount, processId };
}

export function waitForTransaction(properties: Properties<WaitForTransaction>): WaitForTransaction {
  const { processId, transactionSubmissionState } = properties;
  return { type: WAIT_FOR_TRANSACTION, transactionSubmissionState, processId };
}

export function waitForAcknowledgement(
  properties: Properties<WaitForAcknowledgement>,
): WaitForAcknowledgement {
  const { processId } = properties;
  return { type: WAIT_FOR_ACKNOWLEDGEMENT, processId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}
