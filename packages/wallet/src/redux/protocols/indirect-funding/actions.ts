import { NewLedgerFundingAction, isNewLedgerFundingAction } from '../new-ledger-funding/actions';
import {
  ExistingLedgerFundingAction,
  isExistingLedgerFundingAction,
} from '../existing-ledger-funding';
import { WalletAction } from '../../actions';

export type IndirectFundingAction = NewLedgerFundingAction | ExistingLedgerFundingAction;

export const isIndirectFundingAction = (
  action: WalletAction,
  path = '',
  descriptor = '',
): action is IndirectFundingAction => {
  return (
    isNewLedgerFundingAction(action) || isExistingLedgerFundingAction(action, path, descriptor)
  );
};
