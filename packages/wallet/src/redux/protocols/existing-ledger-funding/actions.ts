import { CommitmentReceived, WalletAction } from '../../actions';
import { LedgerTopUpAction, isLedgerTopUpAction } from '../ledger-top-up/actions';
import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from './reducer';
import { isChannelSyncAction } from '../channel-sync/actions';

export type ExistingLedgerFundingAction = CommitmentReceived | LedgerTopUpAction;

export function isExistingLedgerFundingAction(
  action: WalletAction,
): action is ExistingLedgerFundingAction {
  return (
    (action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' &&
      action.protocolLocator === EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR) ||
    isLedgerTopUpAction(action) ||
    isChannelSyncAction(action)
  );
}
