import { WalletAction } from '../../actions';
import { IndirectDefundingAction, isIndirectDefundingAction } from '../indirect-defunding/actions';
import { isWithdrawalAction, WithdrawalAction } from '../withdrawing/actions';

// -------
// Actions
// -------

// -------
// Constructors
// -------

// -------
// Unions and Guards
// -------

// TODO: Replace once ledger defunding actions are defined
export type DefundingAction = WithdrawalAction | IndirectDefundingAction;

export const isDefundingAction = (action: WalletAction): action is DefundingAction => {
  return isWithdrawalAction(action) || isIndirectDefundingAction(action);
};
