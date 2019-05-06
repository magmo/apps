import * as playerAFundingActions from './player-a/actions';
import * as playerBFundingActions from './player-b/actions';
import * as playerA from './player-a/states';
import * as playerB from './player-b/states';
import {
  isIndirectFundingAction,
  Action as IndirectFundingAction,
} from '../indirect-funding/actions';

export type FundingAction =
  | playerAFundingActions.FundingAction
  | playerBFundingActions.FundingAction
  | IndirectFundingAction;

export { playerA, playerB };

export function isPlayerAFundingAction(
  action: FundingAction,
): action is playerAFundingActions.FundingAction {
  return (
    action.type === playerAFundingActions.CANCELLED ||
    // TODO: Add this to the check when the action exists action.type === playerAFundingActions.CANCELLED_BY_OPPONENT ||
    action.type === playerAFundingActions.FUNDING_SUCCESS_ACKNOWLEDGED ||
    action.type === playerAFundingActions.STRATEGY_APPROVED ||
    action.type === playerAFundingActions.STRATEGY_CHOSEN ||
    action.type === playerAFundingActions.STRATEGY_REJECTED ||
    isIndirectFundingAction(action)
  );
}
export function isPlayerBFundingAction(
  action: FundingAction,
): action is playerBFundingActions.FundingAction {
  return (
    action.type === playerBFundingActions.CANCELLED ||
    // TODO: Add this to the check when the action exists action.type === playerAFundingActions.CANCELLED_BY_OPPONENT ||
    action.type === playerBFundingActions.FUNDING_SUCCESS_ACKNOWLEDGED ||
    action.type === playerBFundingActions.STRATEGY_APPROVED ||
    action.type === playerBFundingActions.STRATEGY_PROPOSED ||
    action.type === playerBFundingActions.STRATEGY_REJECTED ||
    isIndirectFundingAction(action)
  );
}
