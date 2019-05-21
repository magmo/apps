import { PlayerAState } from './player-a/states';
import { PlayerBState } from './player-b/states';

export * from './player-a/states';
export * from './player-b/states';
import { Constructor } from '../../utils';

// -------
// States
// -------

export interface Success {
  type: 'IndirectFunding.Success';
}

export interface Failure {
  type: 'IndirectFunding.Failure';
}

// ------------
// Constructors
// ------------

export const success: Constructor<Success> = p => {
  return { type: 'IndirectFunding.Success' };
};

export const failure: Constructor<Failure> = p => {
  return { type: 'IndirectFunding.Failure' };
};

// -------
// Unions and Guards
// -------

export function isTerminal(state: IndirectFundingState): state is Failure | Success {
  return state.type === 'IndirectFunding.Failure' || state.type === 'IndirectFunding.Success';
}

export type NonTerminalIndirectFundingState = PlayerAState | PlayerBState;
export type IndirectFundingState = NonTerminalIndirectFundingState | Success | Failure;
export type IndirectFundingStateType = IndirectFundingState['type'];
