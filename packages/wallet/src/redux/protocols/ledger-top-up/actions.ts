import { CommitmentReceived, WalletAction } from '../../actions';
import { DirectFundingAction } from '../direct-funding';
import { isDirectFundingAction } from '../direct-funding/actions';
import { isCommonAction, EmbeddedProtocol } from '../../../communication';

export type LedgerTopUpAction = CommitmentReceived | DirectFundingAction;

export function isLedgerTopUpAction(
  action: WalletAction,
  path = [],
  descriptor = EmbeddedProtocol.LedgerTopUp,
): action is LedgerTopUpAction {
  return isCommonAction(action, path, descriptor) || isDirectFundingAction(action);
}
