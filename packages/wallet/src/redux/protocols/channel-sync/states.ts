import { StateConstructor } from '../../utils';

export interface Failure {
  type: 'ChannelSync.Failure';
  reason: string;
}

export interface Success {
  type: 'ChannelSync.Success';
}

export interface WaitForUpdate {
  type: 'ChannelSync.WaitForUpdate';
  processId: string;
  channelId: string;
  updatesLeft: number;
}

// -------
// Constructors
// -------

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'ChannelSync.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'ChannelSync.Failure' };
};

export const waitForUpdate: StateConstructor<WaitForUpdate> = p => {
  return { ...p, type: 'ChannelSync.WaitForUpdate' };
};

export type TerminalChannelSyncState = Success | Failure;
export type NonTerminalChannelSyncState = WaitForUpdate;
export type ChannelSyncState = NonTerminalChannelSyncState | TerminalChannelSyncState;
export type ChannelSyncStateType = ChannelSyncState['type'];
