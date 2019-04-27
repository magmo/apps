import { ChannelState } from './channel-state';

export interface InitializingChannelState {
  address: string;
  privateKey: string;
}

export interface InitializedChannels {
  [channelId: string]: ChannelState;
}
export interface ChannelStore {
  initializedChannels: InitializedChannels;
}

export function emptyChannelStore(): ChannelStore {
  return { initializedChannels: {} };
}

// -------------------
// Getters and setters
// -------------------

export function setChannel(store: ChannelStore, channel: ChannelState): ChannelStore {
  const channelId = channel.channelId;
  const initializedChannels = { ...store.initializedChannels, [channelId]: channel };
  return { ...store, initializedChannels };
}

export function getChannel(store: ChannelStore, channelId: string): ChannelState | undefined {
  return store.initializedChannels[channelId];
}
