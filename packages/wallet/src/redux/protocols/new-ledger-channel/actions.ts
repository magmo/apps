import { isDirectFundingAction, DirectFundingAction } from '../direct-funding/actions';
import { ConsensusUpdateAction, isConsensusUpdateAction } from '../consensus-update';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';
import { WalletAction } from '../../actions';

// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export type NewLedgerChannelAction =
  | ConsensusUpdateAction
  | AdvanceChannelAction
  | DirectFundingAction;
export function isNewLedgerChannelAction(action: WalletAction): action is NewLedgerChannelAction {
  return (
    isDirectFundingAction(action) ||
    isConsensusUpdateAction(action) ||
    isAdvanceChannelAction(action)
  );
}
