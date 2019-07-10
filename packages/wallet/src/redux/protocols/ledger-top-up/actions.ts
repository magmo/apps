import { CommitmentReceived, WalletAction } from '../../actions';
import { DirectFundingAction } from '../direct-funding';
import { isDirectFundingAction } from '../direct-funding/actions';
import { LEDGER_TOP_UP_PROTOCOL_LOCATOR } from './reducer';
import { isCommonAction } from '../../../communication';

export type LedgerTopUpAction = CommitmentReceived | DirectFundingAction;

export function isLedgerTopUpAction(
  action: WalletAction,
  path = '',
  descriptor = LEDGER_TOP_UP_PROTOCOL_LOCATOR,
): action is LedgerTopUpAction {
  return isCommonAction(action, path, descriptor) || isDirectFundingAction(action);
}
