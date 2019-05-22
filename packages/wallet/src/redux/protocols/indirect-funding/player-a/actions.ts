import { ActionConstructor } from 'src/redux/utils';
import { Commitment } from '../../../../domain';

// -------
// Actions
// -------
export interface StrategyApproved {
  type: 'WALLET.INDIRECT_FUNDING.PLAYER_A.STRATEGY_APPROVED';
  processId: string;
  channelId: string;
  consensusLibrary: string;
}

export interface AllocationChanged {
  type: 'WALLET.INDIRECT_FUNDING.PLAYER_A.ALLOCATION_CHANGED';
  processId: string;
  channelId: string;
  consensusLibrary: string;
  commitment: Commitment;
}
// --------
// Constructors
// --------

export const strategyApproved: ActionConstructor<StrategyApproved> = p => ({
  type: 'WALLET.INDIRECT_FUNDING.PLAYER_A.STRATEGY_APPROVED',
  ...p,
});

export const allocationChanged: ActionConstructor<AllocationChanged> = p => ({
  type: 'WALLET.INDIRECT_FUNDING.PLAYER_A.ALLOCATION_CHANGED',
  ...p,
});

// --------
// Unions and Guards
// --------

export type Action = StrategyApproved | AllocationChanged;
