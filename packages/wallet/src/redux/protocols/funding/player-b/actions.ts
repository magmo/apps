import { BaseProcessAction } from '../../actions';
import { PlayerIndex } from '../../../types';
import { FundingStrategy } from '..';
import { strategyProposed, StrategyProposed } from '../../../../communication';
export { strategyProposed, StrategyProposed };
import { ActionConstructor } from '../../../utils';

// -------
// Actions
// -------

export interface StrategyApproved extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_B.STRATEGY_APPROVED';
  strategy: FundingStrategy;
}

export interface FundingSuccessAcknowledged extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_B.FUNDING_SUCCESS_ACKNOWLEDGED';
}

export interface StrategyRejected extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_B.STRATEGY_REJECTED';
}

export interface Cancelled extends BaseProcessAction {
  type: 'WALLET.FUNDING.PLAYER_B.CANCELLED';
  by: PlayerIndex;
}

// --------
// Constructors
// --------

export const strategyApproved: ActionConstructor<StrategyApproved> = p => ({
  type: 'WALLET.FUNDING.PLAYER_B.STRATEGY_APPROVED',
  ...p,
});

export const fundingSuccessAcknowledged: ActionConstructor<FundingSuccessAcknowledged> = p => ({
  type: 'WALLET.FUNDING.PLAYER_B.FUNDING_SUCCESS_ACKNOWLEDGED',
  ...p,
});

export const strategyRejected: ActionConstructor<StrategyRejected> = p => ({
  type: 'WALLET.FUNDING.PLAYER_B.STRATEGY_REJECTED',
  ...p,
});

export const cancelled: ActionConstructor<Cancelled> = p => ({
  type: 'WALLET.FUNDING.PLAYER_B.CANCELLED',
  ...p,
});

// -------
// Unions and Guards
// -------
export type FundingAction =
  | StrategyProposed
  | StrategyApproved
  | FundingSuccessAcknowledged
  | StrategyRejected
  | Cancelled;
