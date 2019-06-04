import { CommitmentReceived, WalletAction } from '../../actions';
import { DirectFundingAction } from '../direct-funding';
import { isDirectFundingAction } from '../direct-funding/actions';

export type LedgerTopUpAction = CommitmentReceived | DirectFundingAction;

export function isLedgerTopUpAction(action: WalletAction): action is LedgerTopUpAction {
  return action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' || isDirectFundingAction(action);
}
