import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';
export interface DisplayChannel {
  channelId: string;
  opponentAmount: string;
  ourAmount: string;
  opponentAddress: string;
  ourAddress: string;
  opponentName?: string;
  inUse: boolean;
}
export interface DisplayChannels {
  type: 'ChannelManagement.DisplayChannels';
  processId: string;
  displayChannels: DisplayChannel[];
}
export interface Success {
  type: 'ChannelManagement.Success';
}

export const displayChannels: StateConstructor<DisplayChannels> = p => {
  return { ...p, type: 'ChannelManagement.DisplayChannels' };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'ChannelManagement.Success' };
};

export type TerminalChannelManagementState = Success;
export type NonTerminalChannelManagementState = DisplayChannels;
export type ChannelManagementState =
  | TerminalChannelManagementState
  | NonTerminalChannelManagementState;

export function isTerminalChannelManagementState(
  state: ChannelManagementState,
): state is TerminalChannelManagementState {
  return state.type === 'ChannelManagement.Success';
}

export function isNonTerminalChannelManagementState(
  state: ChannelManagementState,
): state is NonTerminalChannelManagementState {
  return state.type === 'ChannelManagement.DisplayChannels';
}

export function isChannelManagementState(state: ProtocolState): state is ChannelManagementState {
  return state.type.indexOf('ChannelManagement.') === 0;
}
