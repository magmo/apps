import { CommitmentReceived, WalletAction } from '../../actions';
import { LedgerTopUpAction, isLedgerTopUpAction } from '../ledger-top-up/actions';
import { isCommonAction, EmbeddedProtocol, routerFactory } from '../../../communication';

import { isChannelSyncAction } from '../channel-sync/actions';

export type ExistingLedgerFundingAction = CommitmentReceived | LedgerTopUpAction;

export function isExistingLedgerFundingAction(
  action: WalletAction,
): action is ExistingLedgerFundingAction {
  return (
    isCommonAction(action, EmbeddedProtocol.ExistingLedgerFunding) ||
    isLedgerTopUpAction(action) ||
    isChannelSyncAction(action)
  );
}

export const routestoExistingLedgerFunding = routerFactory(
  isExistingLedgerFundingAction,
  EmbeddedProtocol.ExistingLedgerFunding,
);
