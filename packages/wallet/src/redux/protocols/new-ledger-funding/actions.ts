import * as playerA from './player-a/actions';
import * as playerB from './player-b/actions';
import { WalletAction } from '../../actions';
import { isDirectFundingAction } from '../direct-funding/actions';
import { isCommonAction, CommonAction } from '../../../communication';

// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export { playerA, playerB };
export type ProcessAction = playerA.Action | playerB.Action;
export type NewLedgerFundingAction = ProcessAction | CommonAction;

export function isNewLedgerFundingAction(
  action: WalletAction,
  path = '',
  descriptor?,
): action is NewLedgerFundingAction {
  return (
    isCommonAction(action, path, descriptor) ||
    isDirectFundingAction(action) ||
    playerA.isNewLedgerFundingAction(action) ||
    playerB.isNewLedgerFundingAction(action, path, descriptor)
  );
}
