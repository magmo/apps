import { ProtocolState } from '..';
import { StateConstructor } from '../../utils';

// -------
// States
// -------

export interface Success {
  type: 'VirtualFunding.Success';
}

export interface Failure {
  type: 'VirtualFunding.Failure';
}

// ------------
// Constructors
// ------------

export const success: StateConstructor<Success> = p => {
  return { type: 'VirtualFunding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { type: 'VirtualFunding.Failure' };
};

// -------
// Unions and Guards
// -------

export interface NonTerminalVirtualFundingState {
  type: VirtualFundingStateType;
}

export type VirtualFundingState = Success | Failure;
export type VirtualFundingStateType = VirtualFundingState['type'];

export function isVirtualFundingState(state: ProtocolState): state is VirtualFundingState {
  return (
    state.type === 'VirtualFunding.Failure' ||
    state.type === 'VirtualFunding.Success' ||
  );
}

export function isTerminal(state: VirtualFundingState): state is Failure | Success {
  return state.type === 'VirtualFunding.Failure' || state.type === 'VirtualFunding.Success';
}
