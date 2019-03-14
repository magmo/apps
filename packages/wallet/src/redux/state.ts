import { SharedWalletState } from './sharedState';
import { InitializingState } from './initializingState';
import { InitializedState } from './initializedState';

export * from './initializedState';
export * from './initializingState';

export { SharedWalletState };

export type WalletState = InitializingState | InitializedState;
