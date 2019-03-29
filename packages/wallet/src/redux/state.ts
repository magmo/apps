import { InitializingState } from './initializing/state';
import { InitializedState } from './initialized/state';

export * from './initialized/state';
export * from './initializing/state';

export type WalletState = InitializingState | InitializedState;
