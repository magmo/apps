import { CommitmentReceived, WalletAction } from '../../actions';
import { LedgerTopUpAction, isLedgerTopUpAction } from '../ledger-top-up/actions';

export type ExistingChannelFundingAction = CommitmentReceived | LedgerTopUpAction;

export function isExistingChannelFundingAction(
  action: WalletAction,
): action is ExistingChannelFundingAction {
  return action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' || isLedgerTopUpAction(action);
}
