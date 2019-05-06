import * as playerA from './player-a/actions';
import * as playerB from './player-b/actions';
import {
  isIndirectFundingAction,
  Action as IndirectFundingAction,
} from '../indirect-funding/actions';

export type FundingAction = playerA.FundingAction | playerB.FundingAction | IndirectFundingAction;

export function isPlayerAFundingAction(action: FundingAction): action is playerA.FundingAction {
  return (
    action.type === playerA.CANCELLED ||
    // TODO: Add this to the check when the action exists action.type === playerAFundingActions.CANCELLED_BY_OPPONENT ||
    action.type === playerA.FUNDING_SUCCESS_ACKNOWLEDGED ||
    action.type === playerA.STRATEGY_APPROVED ||
    action.type === playerA.STRATEGY_CHOSEN ||
    action.type === playerA.STRATEGY_REJECTED ||
    isIndirectFundingAction(action)
  );
}
export function isPlayerBFundingAction(action: FundingAction): action is playerB.FundingAction {
  return (
    action.type === playerB.CANCELLED ||
    // TODO: Add this to the check when the action exists action.type === playerAFundingActions.CANCELLED_BY_OPPONENT ||
    action.type === playerB.FUNDING_SUCCESS_ACKNOWLEDGED ||
    action.type === playerB.STRATEGY_APPROVED ||
    action.type === playerB.STRATEGY_PROPOSED ||
    action.type === playerB.STRATEGY_REJECTED ||
    isIndirectFundingAction(action)
  );
}
