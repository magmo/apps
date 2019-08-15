import { WithdrawalState } from '../withdrawing/states';
import { AdvanceChannelState } from '../advance-channel';
import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';

export interface WaitForWithdrawal {
  type: 'CloseChannel.WaitForWithdrawal';
  processId: string;
  withdrawal: WithdrawalState;
  channelId;
}
export interface WaitForConclude {
  type: 'CloseChannel.WaitForConclude';
  processId: string;
  concluding: AdvanceChannelState;
  channelId;
}

export interface Failure {
  type: 'CloseChannel.Failure';
  reason: string;
}

export interface Success {
  type: 'CloseChannel.Success';
}

// -------
// Constructors
// -------

export const waitForWithdrawal: StateConstructor<WaitForWithdrawal> = p => {
  return { ...p, type: 'CloseChannel.WaitForWithdrawal' };
};

export const waitForConclude: StateConstructor<WaitForConclude> = p => {
  return { ...p, type: 'CloseChannel.WaitForConclude' };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'CloseChannel.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'CloseChannel.Failure' };
};

// -------
// Unions and Guards
// -------
export type TerminalCloseChannelState = Failure | Success;
export type NonTerminalCloseChannelState = WaitForConclude | WaitForWithdrawal;
export type CloseChannelState = TerminalCloseChannelState | NonTerminalCloseChannelState;
export type CloseChannelStateType = CloseChannelState['type'];

export function isCloseChannelState(state: ProtocolState): state is CloseChannelState {
  return state.type.indexOf('CloseChannel') === 0;
}

export function isTerminalCloseChannelState(
  state: ProtocolState,
): state is TerminalCloseChannelState {
  return state.type === 'CloseChannel.Failure' || state.type === 'CloseChannel.Success';
}
export function isNonTerminalCloseChannelState(
  state: ProtocolState,
): state is NonTerminalCloseChannelState {
  return !isTerminalCloseChannelState(state);
}
