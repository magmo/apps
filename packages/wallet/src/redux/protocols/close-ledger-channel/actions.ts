import { WalletAction } from '../../actions';
import { WithdrawalAction, isWithdrawalAction } from '../withdrawing/actions';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';

// -------
// Actions
// -------

// -------
// Constructors
// -------

// -------
// Unions and Guards
// -------

export type CloseChannelAction = WithdrawalAction | AdvanceChannelAction;

export const isCloseChannelAction = (action: WalletAction): action is CloseChannelAction => {
  return isWithdrawalAction(action) || isAdvanceChannelAction(action);
};
