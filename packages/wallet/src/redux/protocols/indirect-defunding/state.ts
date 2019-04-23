import { Properties } from '../../utils';

export const WAIT_FOR_LEDGER_UPDATE = 'WaitForLedgerUpdate';
export const WAIT_FOR_FINAL_LEDGER_UPDATE = 'WaitForFinalLedgerUpdate';
export const FAILURE = 'Failure';
export const SUCCESS = 'Success';
export type FailureReason = 'Received Invalid Commitment';

export type IndirectDefundingState =
  | WaitForLedgerUpdate
  | WaitForFinalLedgerUpdate
  | Success
  | Failure;
export interface WaitForLedgerUpdate {
  type: typeof WAIT_FOR_LEDGER_UPDATE;
  processId: string;
  channelId: string;
}
export interface WaitForFinalLedgerUpdate {
  type: typeof WAIT_FOR_FINAL_LEDGER_UPDATE;
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

export function isTerminal(state: IndirectDefundingState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

// -------
// Constructors
// -------

export function waitForLedgerUpdate(
  properties: Properties<WaitForLedgerUpdate>,
): WaitForLedgerUpdate {
  const { processId } = properties;
  return { type: WAIT_FOR_LEDGER_UPDATE, processId };
}

export function waitForFinalLedgerUpdate(
  properties: Properties<WaitForFinalLedgerUpdate>,
): WaitForFinalLedgerUpdate {
  const { processId } = properties;
  return { type: WAIT_FOR_FINAL_LEDGER_UPDATE, processId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: FailureReason): Failure {
  return { type: FAILURE, reason };
}
