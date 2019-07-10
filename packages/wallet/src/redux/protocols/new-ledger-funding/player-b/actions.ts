import { DirectFundingAction } from '../../direct-funding';
import { CommitmentReceived, WalletAction } from '../../../actions';
import { isDirectFundingAction } from '../../direct-funding/actions';
import { NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../reducer';
import { isCommonAction } from '../../../../communication';
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

export function isNewLedgerFundingAction(
  action: WalletAction,
  path = '',
  descriptor = NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR,
): action is Action {
  return (
    isCommonAction(action, path, descriptor) ||
    isDirectFundingAction(action) ||
    action.type === 'WALLET.NEW_LEDGER_FUNDING.PLAYER_A.STRATEGY_APPROVED'
  );
}
