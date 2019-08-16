import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';
import { AdvanceChannelState } from '../advance-channel';
import { DefundingState } from '../defunding/states';

// -------
// States
// -------

export interface Failure {
  type: 'Concluding.Failure';
  reason: string;
}

export interface Success {
  type: 'Concluding.Success';
}

export interface WaitForConclude {
  type: 'Concluding.WaitForConclude';
  channelId: string;
  concluding: AdvanceChannelState;
  processId: string;
}

export interface WaitForDefund {
  type: 'Concluding.WaitForDefund';
  channelId: string;
  defunding: DefundingState;
  processId: string;
}

// -------
// Constructors
// -------

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'Concluding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'Concluding.Failure' };
};
export const waitForDefund: StateConstructor<WaitForDefund> = p => {
  return { ...p, type: 'Concluding.WaitForDefund' };
};

export const waitForConclude: StateConstructor<WaitForConclude> = p => {
  return { ...p, type: 'Concluding.WaitForConclude' };
};
// -------
// Unions and Guards
// -------

export type NonTerminalConcludingState = WaitForConclude | WaitForDefund;
export type TerminalConcludingState = Success | Failure;
export type ConcludingState = TerminalConcludingState | NonTerminalConcludingState;
export type ConcludingStateType = ConcludingState['type'];
export function isConcludingState(state: ProtocolState): state is ConcludingState {
  return state.type.indexOf('Concluding') === 0;
}

export function isTerminalConcludingState(state: ProtocolState): state is TerminalConcludingState {
  return state.type === 'Concluding.Failure' || state.type === 'Concluding.Success';
}
export function isNonTerminalConcludingState(
  state: ProtocolState,
): state is NonTerminalConcludingState {
  return isConcludingState(state) && !isTerminalConcludingState(state);
}
