import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { accumulateSideEffects } from '.';
import { SignedState } from 'nitro-protocol';

export function emptyDisplayOutboxState(): OutboxState {
  return { displayOutbox: [], messageOutbox: [], transactionOutbox: [], validationOutbox: [] };
}

export interface QueuedTransaction {
  transactionRequest: TransactionRequest;
  processId: string;
}

export interface ValidationRequest {
  statesToValidate: SignedState[];
  previousState?: SignedState;
}
export type DisplayOutbox = DisplayAction[];
export type MessageOutbox = WalletEvent[];
export type TransactionOutbox = QueuedTransaction[];
export type ValidationOutbox = ValidationRequest[];

export interface OutboxState {
  displayOutbox: DisplayOutbox;
  messageOutbox: MessageOutbox;
  transactionOutbox: TransactionOutbox;
  validationOutbox: ValidationOutbox;
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

export function queueValidationRequest(state: OutboxState, validationRequest: ValidationRequest) {
  return accumulateSideEffects(state, { validationOutbox: validationRequest });
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
