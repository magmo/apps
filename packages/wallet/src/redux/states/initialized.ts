import { AdjudicatorKnown, adjudicatorKnown } from './shared';
import { SharedChannelState } from './channels/shared';
import { waitForChannel } from './channels';

interface BaseInitializingChannel extends AdjudicatorKnown {
  channelState: SharedChannelState;
}

// stage
export const WALLET_INITIALIZED = 'WALLET.INITIALIZED';

// types
export const INITIALIZING_CHANNEL = 'WALLET.INITIALIZING_CHANNEL';
export const WAITING_FOR_CHANNEL_INITIALIZATION = 'WALLET.WAITING_FOR_CHANNEL_INITIALIZATION';

export interface WaitingForChannelInitialization extends AdjudicatorKnown {
  stage: typeof WALLET_INITIALIZED;
  type: typeof WAITING_FOR_CHANNEL_INITIALIZATION;
}

export function waitingForChannelInitialization<T extends AdjudicatorKnown>(
  params: T,
): WaitingForChannelInitialization {
  const { outboxState, uid } = params;
  return {
    ...adjudicatorKnown(params),
    type: WAITING_FOR_CHANNEL_INITIALIZATION,
    stage: WALLET_INITIALIZED,
    outboxState,
    uid,
  };
}

export interface InitializingChannel extends BaseInitializingChannel {
  stage: typeof WALLET_INITIALIZED;
  type: typeof INITIALIZING_CHANNEL;
}

export function initializingChannel<T extends BaseInitializingChannel>(
  params: T,
): InitializingChannel {
  const { outboxState, channelState } = params;
  return {
    ...adjudicatorKnown(params),
    type: INITIALIZING_CHANNEL,
    stage: WALLET_INITIALIZED,
    outboxState,
    channelState: waitForChannel(channelState),
  };
}

export type InitializedState = WaitingForChannelInitialization | InitializingChannel;
