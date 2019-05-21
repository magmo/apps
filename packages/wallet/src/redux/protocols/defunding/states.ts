import { WithdrawalState } from '../withdrawing/states';
import { Properties } from '../../utils';
import { IndirectDefundingState } from '../indirect-defunding/states';

// -------
// States
// -------

export type FailureReason =
  | 'Withdrawal Failure'
  | 'Ledger De-funding Failure'
  | 'Channel Not Closed';

export interface WaitForWithdrawal {
  type: 'Defunding.WaitForWithdrawal';
  processId: string;
  withdrawalState: WithdrawalState;
  channelId;
}

export interface WaitForIndirectDefunding {
  type: 'Defunding.WaitForIndirectDefunding';
  processId: string;
  indirectDefundingState: IndirectDefundingState;
  channelId;
}

export interface Failure {
  type: 'Defunding.Failure';
  reason: string;
}

export interface Success {
  type: 'Defunding.Success';
}

// -------
// Constructors
// -------

export function waitForWithdrawal(properties: Properties<WaitForWithdrawal>): WaitForWithdrawal {
  const { processId, withdrawalState, channelId } = properties;
  return { type: 'Defunding.WaitForWithdrawal', processId, withdrawalState, channelId };
}

export function waitForLedgerDefunding(
  properties: Properties<WaitForIndirectDefunding>,
): WaitForIndirectDefunding {
  const { processId, indirectDefundingState: ledgerDefundingState, channelId } = properties;
  return {
    type: 'Defunding.WaitForIndirectDefunding',
    processId,
    indirectDefundingState: ledgerDefundingState,
    channelId,
  };
}

export function success({}): Success {
  return { type: 'Defunding.Success' };
}

export function failure(reason: FailureReason): Failure {
  return { type: 'Defunding.Failure', reason };
}

// -------
// Unions and Guards
// -------

export type NonTerminalDefundingState = WaitForWithdrawal | WaitForIndirectDefunding;
export type DefundingState = WaitForWithdrawal | WaitForIndirectDefunding | Failure | Success;
export type DefundingStateType = DefundingState['type'];

export function isTerminal(state: DefundingState): state is Failure | Success {
  return state.type === 'Defunding.Failure' || state.type === 'Defunding.Success';
}

export function isSuccess(state: DefundingState): state is Success {
  return state.type === 'Defunding.Success';
}

export function isFailure(state: DefundingState): state is Failure {
  return state.type === 'Defunding.Failure';
}
