import { CommitmentReceived, WalletAction } from '../../actions';
import { LedgerTopUpAction, isLedgerTopUpAction } from '../ledger-top-up/actions';
import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from './reducer';
import { isCommonAction, ProtocolLocator } from '../../../communication';

export type ExistingLedgerFundingAction = CommitmentReceived | LedgerTopUpAction;

export function isExistingLedgerFundingAction(
  action: WalletAction,
  path: ProtocolLocator = [],
  descriptor = EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR[0],
): action is ExistingLedgerFundingAction {
  return isCommonAction(action, path, descriptor) || isLedgerTopUpAction(action);
}
