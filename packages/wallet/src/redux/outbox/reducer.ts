import { OutboxState } from './state';
import * as actions from '../actions';

export function clearOutbox(state: OutboxState, action: actions.WalletAction): OutboxState {
  const nextOutbox = { ...state };
  if (action.type === 'WALLET.MESSAGE_SENT') {
    nextOutbox.messageOutbox = nextOutbox.messageOutbox.slice(1);
  }
  if (action.type === 'WALLET.DISPLAY_MESSAGE_SENT') {
    nextOutbox.displayOutbox = nextOutbox.displayOutbox.slice(1);
  }
  if (action.type === 'WALLET.TRANSACTION_SUBMISSION.TRANSACTION_SENT') {
    nextOutbox.transactionOutbox = nextOutbox.transactionOutbox.slice(1);
  }
  if (
    action.type === 'WALLET.LOCKING.LOCK_CHANNEL_REQUEST' ||
    action.type === 'WALLET.LOCKING.UNLOCK_CHANNEL_REQUEST'
  ) {
    nextOutbox.lockOutbox = nextOutbox.lockOutbox.slice(1);
  }

  return nextOutbox;
}
