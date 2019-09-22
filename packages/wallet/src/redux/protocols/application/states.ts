import { StateConstructor } from '../../utils';
import { DisputeState } from '../dispute/state';
import { ProtocolState } from '..';

// -------
// States
// -------
export interface WaitForFirstState {
  type: 'Application.WaitForFirstState';
  channelId: string;
  address: string;
  privateKey: string;
}

export interface Ongoing {
  type: 'Application.Ongoing';
  channelId: string;
  address: string;
  privateKey: string;
}

export interface WaitForDispute {
  type: 'Application.WaitForDispute';
  channelId: string;
  address: string;
  privateKey: string;
  disputeState: DisputeState;
}

export interface Success {
  type: 'Application.Success';
}

// -------
// Constructors
// -------
export const waitForFirstState: StateConstructor<WaitForFirstState> = p => {
  return { ...p, type: 'Application.WaitForFirstState' };
};

export const ongoing: StateConstructor<Ongoing> = p => {
  return { ...p, type: 'Application.Ongoing' };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'Application.Success' };
};

export const waitForDispute: StateConstructor<WaitForDispute> = p => {
  return { ...p, type: 'Application.WaitForDispute' };
};

// -------
// Unions and Guards
// -------

export type ApplicationState = TerminalApplicationState | NonTerminalApplicationState;
export type NonTerminalApplicationState = WaitForFirstState | WaitForDispute | Ongoing;
export type TerminalApplicationState = Success;
export type ApplicationStateType = ApplicationState['type'];

export function isTerminalApplicationState(state: ApplicationState): state is Success {
  return state.type === 'Application.Success';
}

export function isApplicationState(state: ProtocolState): state is ApplicationState {
  return (
    state.type === 'Application.WaitForDispute' ||
    state.type === 'Application.Ongoing' ||
    state.type === 'Application.WaitForFirstState'
  );
}
