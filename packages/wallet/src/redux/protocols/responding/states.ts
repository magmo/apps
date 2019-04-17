import { TransactionSubmissionState } from '../transaction-submission/states';
import { Properties } from '../../utils';
export type RespondingState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForAcknowledgement
  | WaitForResponse
  | Success
  | Failure;

export const enum FailureReason {
  Generic = 'Oops',
}

export const WAIT_FOR_APPROVAL = 'WaitForApproval';
export const WAIT_FOR_TRANSACTION = 'WaitForTransaction';
export const WAIT_FOR_ACKNOWLEDGEMENT = 'WaitForAcknowledgement';
export const WAIT_FOR_RESPONSE = 'WaitForResponse';
export const FAILURE = 'Failure';
export const SUCCESS = 'Success';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  processId: string;
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

export interface WaitForResponse {
  type: typeof WAIT_FOR_RESPONSE;
  processId: string;
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

export function isTerminal(state: RespondingState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

// -------
// Constructors
// -------

export function waitForApproval(properties: Properties<WaitForApproval>): WaitForApproval {
  const { processId } = properties;
  return { type: WAIT_FOR_APPROVAL, processId };
}

export function waitForTransaction(properties: Properties<WaitForTransaction>): WaitForTransaction {
  const { processId, transactionSubmissionState } = properties;
  return {
    type: WAIT_FOR_TRANSACTION,
    transactionSubmissionState,
    processId,
  };
}

export function waitForAcknowledgement(
  properties: Properties<WaitForAcknowledgement>,
): WaitForAcknowledgement {
  const { processId } = properties;
  return { type: WAIT_FOR_ACKNOWLEDGEMENT, processId };
}

export function waitForResponse(properties: Properties<WaitForResponse>): WaitForResponse {
  const { processId } = properties;
  return { type: WAIT_FOR_RESPONSE, processId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: FailureReason): Failure {
  return { type: FAILURE, reason };
}
