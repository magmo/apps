import { WalletAction } from '../../actions';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';
import { isNewLedgerFundingAction, NewLedgerFundingAction } from '../new-ledger-funding/actions';

export type VirtualFundingAction = NewLedgerFundingAction | AdvanceChannelAction; // | ConsensusReachedAction

export function isVirtualFundingAction(action: WalletAction): action is VirtualFundingAction {
  return isNewLedgerFundingAction(action) || isAdvanceChannelAction(action);
}
