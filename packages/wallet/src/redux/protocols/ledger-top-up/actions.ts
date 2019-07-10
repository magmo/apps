import { CommitmentReceived, WalletAction } from '../../actions';
import { DirectFundingAction } from '../direct-funding';
import { isDirectFundingAction } from '../direct-funding/actions';
import { isCommonAction, EmbeddedProtocol, routesToProtocol } from '../../../communication';

export type LedgerTopUpAction = CommitmentReceived | DirectFundingAction;

export function isLedgerTopUpAction(action: WalletAction): action is LedgerTopUpAction {
  return isCommonAction(action, EmbeddedProtocol.LedgerTopUp) || isDirectFundingAction(action);
}

export function routesToLedgerTopUp(
  action: WalletAction,
  path = [],
  descriptor = EmbeddedProtocol.LedgerTopUp,
): action is LedgerTopUpAction {
  return isLedgerTopUpAction(action) && routesToProtocol(action, path, descriptor);
}
