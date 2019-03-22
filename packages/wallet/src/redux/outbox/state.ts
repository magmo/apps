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
  displayOutbox?: DisplayAction;
  messageOutbox?: WalletEvent;
  transactionOutbox?: TransactionRequest;
  actionOutbox?: internal.InternalAction;
}

export type SideEffects = Partial<OutboxState> | undefined;
