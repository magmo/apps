import { ChannelState } from './channel-state';

export interface ChannelStore {
  [channelId: string]: ChannelState;
}
