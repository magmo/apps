import { NewLedgerFundingAction, isNewLedgerFundingAction } from '../new-ledger-funding/actions';
import {
  ExistingLedgerFundingAction,
  isExistingLedgerFundingAction,
} from '../existing-ledger-funding';
import { WalletAction } from '../../actions';
import { makeLocator } from '..';
import { ProtocolLocator, EmbeddedProtocol } from '../../../communication';

export type IndirectFundingAction = NewLedgerFundingAction | ExistingLedgerFundingAction;

export const isIndirectFundingAction = (
  action: WalletAction,
  path: ProtocolLocator = [],
  descriptor,
): action is IndirectFundingAction => {
  return (
    isNewLedgerFundingAction(
      action,
      makeLocator(path, descriptor),
      EmbeddedProtocol.NewLedgerFunding,
    ) ||
    isExistingLedgerFundingAction(
      action,
      makeLocator(path, descriptor),
      EmbeddedProtocol.ExistingLedgerFunding,
    )
  );
};
