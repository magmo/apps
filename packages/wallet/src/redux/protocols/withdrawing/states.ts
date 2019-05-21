import { NonTerminalTransactionSubmissionState as NonTerminalTSState } from '../transaction-submission/states';
import { Properties } from '../../utils';

// -------
// States
// -------
export interface WaitForApproval {
  type: 'Withdrawing.WaitforApproval';
  processId: string;
  channelId: string;
  withdrawalAmount: string;
}

export interface WaitForTransaction {
  type: 'Withdrawing.WaitForTransaction';
  processId: string;
  channelId: string;
  transactionSubmissionState: NonTerminalTSState;
  withdrawalAddress: string;
}

export interface WaitForAcknowledgement {
  type: 'Withdrawing.WaitForAcknowledgement';
  processId: string;
  channelId: string;
}

export interface Failure {
  type: 'Withdrawing.Failure';
  reason: string;
}

export interface Success {
  type: 'Withdrawing.Success';
}

// ------------
// Constructors
// ------------

export function waitForApproval(properties: Properties<WaitForApproval>): WaitForApproval {
  const { processId, withdrawalAmount, channelId } = properties;
  return { type: 'Withdrawing.WaitforApproval', withdrawalAmount, processId, channelId };
}

export function waitForTransaction(properties: Properties<WaitForTransaction>): WaitForTransaction {
  const { processId, transactionSubmissionState, channelId, withdrawalAddress } = properties;
  return {
    type: 'Withdrawing.WaitForTransaction',
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
  return { type: 'Withdrawing.WaitForAcknowledgement', processId, channelId };
}

export function success({}): Success {
  return { type: 'Withdrawing.Success' };
}

export function failure(reason: FailureReason): Failure {
  return { type: 'Withdrawing.Failure', reason };
}

export const enum FailureReason {
  TransactionFailure = 'Transaction failed',
  ChannelNotClosed = 'Channel not closed',
  UserRejected = 'User rejected',
}

// -------
// Unions and Guards
// -------

export type WithdrawalState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForAcknowledgement
  | Failure
  | Success;

export type WithdrawalStateType = WithdrawalState['type'];

export function isTerminal(state: WithdrawalState): state is Failure | Success {
  return state.type === 'Withdrawing.Failure' || state.type === 'Withdrawing.Success';
}
