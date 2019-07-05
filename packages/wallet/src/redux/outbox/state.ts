import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { accumulateSideEffects } from '.';
import { LockRequest } from '../actions';

export function emptyDisplayOutboxState(): OutboxState {
  return { displayOutbox: [], messageOutbox: [], transactionOutbox: [], lockOutbox: [] };
}

export interface QueuedTransaction {
  transactionRequest: TransactionRequest;
  processId: string;
}
export type DisplayOutbox = DisplayAction[];
export type MessageOutbox = WalletEvent[];
export type TransactionOutbox = QueuedTransaction[];
export type LockOutbox = LockRequest[];

export interface OutboxState {
  displayOutbox: DisplayOutbox;
  messageOutbox: MessageOutbox;
  transactionOutbox: TransactionOutbox;
  lockOutbox: LockOutbox;
}

export type SideEffects = {
  [Outbox in keyof OutboxState]?: OutboxState[Outbox] | OutboxState[Outbox][0]
};

// -------------------
// Getters and setters
// -------------------

export function queueMessage(state: OutboxState, message: WalletEvent): OutboxState {
  return accumulateSideEffects(state, { messageOutbox: [message] });
}
export function queueLockRequest(state: OutboxState, lockRequest: LockRequest): OutboxState {
  return accumulateSideEffects(state, { lockOutbox: [lockRequest] });
}
export function queueTransaction(
  state: OutboxState,
  transaction: TransactionRequest,
  processId: string,
): OutboxState {
  return accumulateSideEffects(state, {
    transactionOutbox: { transactionRequest: transaction, processId },
  });
}

export function getLastMessage(state: OutboxState): WalletEvent | undefined {
  const messages = state.messageOutbox;
  return messages[messages.length - 1];
}
