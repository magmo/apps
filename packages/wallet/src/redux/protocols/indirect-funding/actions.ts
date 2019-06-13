import * as playerA from './player-a/actions';
import * as playerB from './player-b/actions';
import { CommonAction, WalletAction, isCommonAction } from '../../actions';
import { isDirectFundingAction } from '../direct-funding/actions';

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
export type IndirectFundingAction = ProcessAction | CommonAction;

export function isIndirectFundingAction(action: WalletAction): action is IndirectFundingAction {
  return (
    isCommonAction(action) ||
    isDirectFundingAction(action) ||
    action.type.indexOf('WALLET.INDIRECT_FUNDING') === 0
  );
}
