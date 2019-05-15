import { NonTerminalTransactionSubmissionState as NonTerminalTSState } from '../transaction-submission/states';
import { Properties } from '../../utils';
import { Commitment } from '../../../domain';
import { ProtocolState } from '..';
export type RespondingState = NonTerminalRespondingState | Success | Failure;

export type NonTerminalRespondingState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForAcknowledgement
  | WaitForResponse;

export const enum FailureReason {
  TransactionFailure = 'Transaction failed',
  UserRejected = 'User rejected',
}

export const WAIT_FOR_APPROVAL = 'Responding.WaitForApproval';
export const WAIT_FOR_TRANSACTION = 'Responding.WaitForTransaction';
export const WAIT_FOR_ACKNOWLEDGEMENT = 'Responding.WaitForAcknowledgement';
export const WAIT_FOR_RESPONSE = 'Responding.WaitForResponse';
export const FAILURE = 'Responding.Failure';
export const SUCCESS = 'Responding.Success';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  processId: string;
  challengeCommitment: Commitment;
}

export interface WaitForTransaction {
  type: typeof WAIT_FOR_TRANSACTION;
  processId: string;
  transactionSubmissionState: NonTerminalTSState;
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

// export const WAIT_FOR_APPROVAL = 'WaitForApproval';
// export const WAIT_FOR_TRANSACTION = 'WaitForTransaction';
// export const WAIT_FOR_ACKNOWLEDGEMENT = 'WaitForAcknowledgement';
// export const WAIT_FOR_RESPONSE = 'WaitForResponse';
// export const FAILURE = 'Failure';
// export const SUCCESS = 'Success';

export function isRespondingState(state: ProtocolState): state is RespondingState {
  return (
    state.type === WAIT_FOR_APPROVAL ||
    state.type === WAIT_FOR_TRANSACTION ||
    state.type === WAIT_FOR_ACKNOWLEDGEMENT ||
    state.type === WAIT_FOR_RESPONSE ||
    state.type === FAILURE ||
    state.type === SUCCESS
  );
}

export function isNonTerminalRespondingState(
  state: ProtocolState,
): state is NonTerminalRespondingState {
  return isRespondingState(state) && !isTerminal(state);
}

export function isTerminal(state: RespondingState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

// -------
// Constructors
// -------

export function waitForApproval(properties: Properties<WaitForApproval>): WaitForApproval {
  const { processId, challengeCommitment } = properties;
  return { type: WAIT_FOR_APPROVAL, processId, challengeCommitment };
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
