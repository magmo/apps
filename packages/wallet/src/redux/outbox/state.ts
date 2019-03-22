import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { internal } from '../actions';

export const EMPTY_OUTBOX_STATE: OutboxState = {
  displayOutbox: undefined,
  messageOutbox: undefined,
  transactionOutbox: undefined,
  actionOutbox: undefined,
};

export interface OutboxState {
  displayOutbox: DisplayAction | undefined;
  messageOutbox: WalletEvent | undefined;
  transactionOutbox: TransactionRequest | undefined;
  actionOutbox: internal.InternalAction | undefined;
}

export type SideEffects = Partial<OutboxState> | undefined;
