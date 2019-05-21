import { BaseProcessAction } from '../../actions';
import { PlayerIndex } from '../../../types';
import { FundingStrategy } from '../../../../communication';
import { strategyApproved, StrategyApproved, STRATEGY_APPROVED } from '../../../../communication';
export { strategyApproved, StrategyApproved, STRATEGY_APPROVED };
import { ActionConstructor } from '../../../utils';

// -------
// Actions
// -------

export interface StrategyChosen extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_A.STRATEGY_CHOSEN';
  strategy: FundingStrategy;
}

export interface FundingSuccessAcknowledged extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_A.FUNDING_SUCCESS_ACKNOWLEDGED';
}

export interface StrategyRejected extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_A.STRATEGY_REJECTED';
}

export interface Cancelled extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_A.CANCELLED';
  by: PlayerIndex;
}

// --------
// Constructors
// --------

export const strategyChosen: ActionConstructor<StrategyChosen> = p => ({
  type: 'WALLET.FUNDING.PLAYER_A.STRATEGY_CHOSEN',
  processId: p.processId,
  strategy: p.strategy,
});

export const fundingSuccessAcknowledged: ActionConstructor<FundingSuccessAcknowledged> = p => ({
  type: 'WALLET.FUNDING.PLAYER_A.FUNDING_SUCCESS_ACKNOWLEDGED',
  processId: p.processId,
});

export const strategyRejected: ActionConstructor<StrategyRejected> = p => ({
  type: 'WALLET.FUNDING.PLAYER_A.STRATEGY_REJECTED',
  processId: p.processId,
});

export const cancelled: ActionConstructor<Cancelled> = p => ({
  type: 'WALLET.FUNDING.PLAYER_A.CANCELLED',
  processId: p.processId,
  by: p.by,
});

// -------
// Unions and Guards
// -------

export type FundingAction =
  | StrategyChosen
  | StrategyApproved
  | FundingSuccessAcknowledged
  | StrategyRejected
  | Cancelled;
