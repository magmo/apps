import { BaseProcessAction } from '../../actions';
import { PlayerIndex } from '../../../types';

export type FundingAction =
  | StrategyProposed
  | StrategyApproved
  | FundingSuccessAcknowledged
  | StrategyRejected
  | Cancelled;

export const STRATEGY_CHOSEN = 'WALLET.FUNDING.STRATEGY_CHOSEN';
export const STRATEGY_APPROVED = 'WALLET.FUNDING.STRATEGY_APPROVED';
export const FUNDING_SUCCESS_ACKNOWLEDGED = 'WALLET.FUNDING.FUNDING_SUCCESS_ACKNOWLEDGED';
export const STRATEGY_REJECTED = 'WALLET.FUNDING.STRATEGY_REJECTED';
export const CANCELLED = 'WALLET.FUNDING.CANCELLED';
export const CANCELLED_BY_OPPONENT = 'WALLET.FUNDING.CANCELLED_BY_OPPONENT';

export interface StrategyProposed extends BaseProcessAction {
  type: typeof STRATEGY_CHOSEN;
}

export interface StrategyApproved extends BaseProcessAction {
  type: typeof STRATEGY_APPROVED;
}

export interface FundingSuccessAcknowledged extends BaseProcessAction {
  type: typeof FUNDING_SUCCESS_ACKNOWLEDGED;
}

export interface StrategyRejected extends BaseProcessAction {
  type: typeof STRATEGY_REJECTED;
}

export interface Cancelled extends BaseProcessAction {
  type: typeof CANCELLED;
  by: PlayerIndex;
}

// --------
// Creators
// --------

export const strategyProposed = (processId: string): StrategyProposed => ({
  type: STRATEGY_CHOSEN,
  processId,
});

export const strategyApproved = (processId: string): StrategyApproved => ({
  type: STRATEGY_APPROVED,
  processId,
});

export const fundingSuccessAcknowledged = (processId: string): FundingSuccessAcknowledged => ({
  type: FUNDING_SUCCESS_ACKNOWLEDGED,
  processId,
});

export const strategyRejected = (processId: string): StrategyRejected => ({
  type: STRATEGY_REJECTED,
  processId,
});

export const cancelled = (processId: string, by: PlayerIndex): Cancelled => ({
  type: CANCELLED,
  processId,
  by,
});
