import { AppChannelStatus } from './app-channel/state';
import { ChannelType } from './shared/state';

export interface InitializingChannelStatus {
  address: string;
  privateKey: string;
  channelType: ChannelType;
}

export interface InitializingChannelState {
  [participantAddress: string]: InitializingChannelStatus;
}

export type ChannelStatus = AppChannelStatus;
export interface InitializedChannelState {
  [channelId: string]: AppChannelStatus;
}
export interface ChannelState {
  initializingChannels: InitializingChannelState;
  initializedChannels: InitializedChannelState;
  activeAppChannelId?: string;
}
