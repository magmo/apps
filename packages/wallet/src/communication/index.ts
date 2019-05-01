export enum Strategy {
  IndirectFunding = 'IndirectFunding',
}

export interface BaseProcessAction {
  processId: string;
  type: string;
}

export const STRATEGY_PROPOSED = 'WALLET.FUNDING.STRATEGY_PROPOSED';
export interface StrategyProposed extends BaseProcessAction {
  type: typeof STRATEGY_PROPOSED;
  strategy: Strategy;
}
export const strategyProposed = (processId: string, strategy): StrategyProposed => ({
  type: STRATEGY_PROPOSED,
  processId,
  strategy,
});

export const STRATEGY_APPROVED = 'WALLET.FUNDING.STRATEGY_APPROVED';
export interface StrategyApproved extends BaseProcessAction {
  type: typeof STRATEGY_APPROVED;
}
export const strategyApproved = (processId: string): StrategyApproved => ({
  type: STRATEGY_APPROVED,
  processId,
});
