import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { WalletAction } from '../actions';

export interface OutboxState {
  displayOutbox?: DisplayAction;
  messageOutbox?: WalletEvent;
  transactionOutbox?: TransactionRequest;
  actionOutbox?: WalletAction;
}
