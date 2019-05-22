import { BaseProcessAction } from '../actions';
import { TransactionAction } from '../transaction-submission/actions';
import { WalletAction, isTransactionAction } from '../../actions';
import { ActionConstructor } from 'src/redux/utils';

// -------
// Actions
// -------
export interface WithdrawalApproved extends BaseProcessAction {
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_APPROVED';
  processId: string;
  withdrawalAddress: string;
}

export interface WithdrawalRejected extends BaseProcessAction {
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_REJECTED';
  processId: string;
}
export interface WithdrawalSuccessAcknowledged extends BaseProcessAction {
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_SUCCESS_ACKNOWLEDGED';
  processId: string;
}

// -------
// Constructors
// -------

export const withdrawalApproved: ActionConstructor<WithdrawalApproved> = p => ({
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_APPROVED',
  ...p,
});

export const withdrawalRejected: ActionConstructor<WithdrawalRejected> = p => ({
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_REJECTED',
  ...p,
});

export const withdrawalSuccessAcknowledged: ActionConstructor<
  WithdrawalSuccessAcknowledged
> = p => ({
  type: 'WALLET.WITHDRAWING.WITHDRAWAL_SUCCESS_ACKNOWLEDGED',
  ...p,
});

// -------
// Types and Guards
// -------
export type WithdrawalAction =
  | WithdrawalApproved
  | WithdrawalRejected
  | WithdrawalSuccessAcknowledged
  | TransactionAction;

export const isWithdrawalAction = (action: WalletAction): action is WithdrawalAction => {
  return (
    isTransactionAction(action) ||
    action.type === 'WALLET.WITHDRAWING.WITHDRAWAL_APPROVED' ||
    action.type === 'WALLET.WITHDRAWING.WITHDRAWAL_SUCCESS_ACKNOWLEDGED' ||
    action.type === 'WALLET.WITHDRAWING.WITHDRAWAL_REJECTED'
  );
};
