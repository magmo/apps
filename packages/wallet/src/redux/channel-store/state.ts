import { OpeningState } from './opening/state';
import { RunningState } from './running/state';
import { FundingState } from './funding/state';

export interface InitializingChannelState {
  address: string;
  privateKey: string;
}

export interface InitializingChannels {
  [participantAddress: string]: InitializingChannelState;
}

export type OpenedState = FundingState | RunningState;

export type ChannelState = OpeningState | OpenedState;

export interface InitializedChannels {
  [channelId: string]: ChannelState;
}
export interface ChannelStore {
  initializingChannels: InitializingChannels;
  initializedChannels: InitializedChannels;
  activeAppChannelId?: string;
}

export function emptyChannelStore(): ChannelStore {
  return { initializedChannels: {}, initializingChannels: {} };
}

// -------------------
// Getters and setters
// -------------------

export function setChannel(channelStore: ChannelStore, channel: ChannelState): ChannelStore {
  const channelId = channel.channelId;
  const initializedChannels = { ...channelStore.initializedChannels, [channelId]: channel };
  return { ...channelStore, initializedChannels };
}

export function getChannel(channelStore: ChannelStore, channelId: string) {
  return channelStore.initializedChannels[channelId];
}

export * from './opening/state';
export * from './running/state';
export * from './funding/state';
