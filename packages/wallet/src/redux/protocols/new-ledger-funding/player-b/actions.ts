import { DirectFundingAction } from '../../direct-funding';
import { CommitmentReceived, WalletAction } from '../../../actions';
import { isDirectFundingAction } from '../../direct-funding/actions';
import { isCommonAction, EmbeddedProtocol } from '../../../../communication';
// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export type Action = DirectFundingAction | CommitmentReceived;

export function isNewLedgerFundingAction(action: WalletAction): action is Action {
  return (
    isCommonAction(action, EmbeddedProtocol.NewLedgerFunding) ||
    isDirectFundingAction(action) ||
    action.type === 'WALLET.NEW_LEDGER_FUNDING.PLAYER_A.STRATEGY_APPROVED'
  );
}
