import { AppChannelStatus } from './app-channel/state';
import { LedgerChannelStatus, InitializingLedgerChannelStatus } from './ledger-channel/state';

export interface BaseInitializingChannelStatus {
  address: string;
  privateKey: string;
}

export interface InitializingChannelState {
  [participantAddress: string]: BaseInitializingChannelStatus | InitializingLedgerChannelStatus;
}

export type ChannelStatus = AppChannelStatus | LedgerChannelStatus;
export interface InitializedChannelState {
  [channelId: string]: ChannelStatus;
}
export interface ChannelState {
  initializingChannels: InitializingChannelState;
  initializedChannels: InitializedChannelState;
  activeAppChannelId?: string;
}
