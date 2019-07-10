import {
  NewLedgerFundingAction,
  isNewLedgerFundingAction,
  routesToNewLedgerFunding,
} from '../new-ledger-funding/actions';
import {
  ExistingLedgerFundingAction,
  isExistingLedgerFundingAction,
} from '../existing-ledger-funding';
import { WalletAction } from '../../actions';
import { makeLocator } from '..';
import { ProtocolLocator, EmbeddedProtocol } from '../../../communication';
import { routestoExistingLedgerFunding } from '../existing-ledger-funding/actions';

export type IndirectFundingAction = NewLedgerFundingAction | ExistingLedgerFundingAction;

export const isIndirectFundingAction = (action: WalletAction): action is IndirectFundingAction => {
  return isNewLedgerFundingAction(action) || isExistingLedgerFundingAction(action);
};

export const routesToIndirectFunding = (
  action: WalletAction,
  path: ProtocolLocator = [],
): action is IndirectFundingAction => {
  return (
    routesToNewLedgerFunding(action, makeLocator(path, EmbeddedProtocol.IndirectFunding)) ||
    routestoExistingLedgerFunding(action, makeLocator(path, EmbeddedProtocol.IndirectFunding))
  );
};
