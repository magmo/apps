import { SharedWalletState, emptyState } from './shared/state';
import { InitializingState } from './initializing/state';
import { InitializedState } from './initialized/state';
import { ChannelStatus } from './channelState/state';

export * from './initialized/state';
export * from './initializing/state';

export { SharedWalletState, emptyState };

export type WalletState = InitializingState | InitializedState;

export function getChannelStatus(state: WalletState, channelId: string): ChannelStatus {
  return state.channelState.initializedChannels[channelId];
}
