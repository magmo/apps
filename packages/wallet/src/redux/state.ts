import { SharedWalletState, emptyState } from './shared/state';
import { InitializingState } from './initializing/state';
import { InitializedState } from './initialized/state';
import { ChannelStatus } from './channelState/state';
import { DirectFundingStatus } from './fundingState/state';

export * from './initialized/state';
export * from './initializing/state';

export { SharedWalletState, emptyState };

export type WalletState = InitializingState | InitializedState;

export function getChannelStatus(state: WalletState, channelId: string): ChannelStatus {
  return state.channelState.initializedChannels[channelId];
}

export function getDirectFundingStatus(state: WalletState, channelId: string): DirectFundingStatus {
  return state.fundingState.directFunding[channelId];
}
