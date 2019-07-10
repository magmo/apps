import { NewLedgerFundingAction, isNewLedgerFundingAction } from '../new-ledger-funding/actions';
import {
  ExistingLedgerFundingAction,
  isExistingLedgerFundingAction,
} from '../existing-ledger-funding';
import { WalletAction } from '../../actions';
import { NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../new-ledger-funding/reducer';
import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../existing-ledger-funding/reducer';
import { makeLocator } from '..';

export type IndirectFundingAction = NewLedgerFundingAction | ExistingLedgerFundingAction;

export const isIndirectFundingAction = (
  action: WalletAction,
  path = '',
  descriptor = '',
): action is IndirectFundingAction => {
  return (
    isNewLedgerFundingAction(
      action,
      makeLocator(path, descriptor),
      NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    ) ||
    isExistingLedgerFundingAction(
      action,
      makeLocator(path, descriptor),
      EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    )
  );
};
