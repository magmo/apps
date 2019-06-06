import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction, MessageRelayRequested } from 'magmo-wallet-client';
import { accumulateSideEffects } from '.';

export function emptyDisplayOutboxState(): OutboxState {
  return { displayOutbox: [], messageOutbox: [], internalMessageOutbox: [], transactionOutbox: [] };
}

export interface QueuedTransaction {
  transactionRequest: TransactionRequest;
  processId: string;
}
export interface OutboxState {
  displayOutbox: DisplayAction[];
  messageOutbox: WalletEvent[];
  internalMessageOutbox: WalletEvent[];
  transactionOutbox: QueuedTransaction[];
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

export function queueInternalMessage(
  state: OutboxState,
  message: MessageRelayRequested,
): OutboxState {
  return accumulateSideEffects(state, { internalMessageOutbox: [message] });
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
