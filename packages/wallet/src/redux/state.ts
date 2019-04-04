import { OutboxState, EMPTY_OUTBOX_STATE } from './outbox/state';
import { ChannelState, ChannelStatus } from './channel-state/state';
import { Properties } from './utils';
import * as indirectFunding from './indirect-funding/state';

export type WalletState = WaitForLogin | WaitForAdjudicator | MetaMaskError | Initialized;

// -----------
// State types
// -----------
export const WAIT_FOR_LOGIN = 'INITIALIZING.WAIT_FOR_LOGIN';
export const METAMASK_ERROR = 'INITIALIZING.METAMASK_ERROR';
export const WAIT_FOR_ADJUDICATOR = 'INITIALIZING.WAIT_FOR_ADJUDICATOR';
export const WALLET_INITIALIZED = 'WALLET.INITIALIZED';

// ------
// States
// ------
export interface WaitForLogin {
  type: typeof WAIT_FOR_LOGIN;
  channelState: ChannelState;
  outboxState: OutboxState;
}

export interface MetaMaskError {
  type: typeof METAMASK_ERROR;
  channelState: ChannelState;
  outboxState: OutboxState;
}

export interface WaitForAdjudicator {
  type: typeof WAIT_FOR_ADJUDICATOR;
  channelState: ChannelState;
  outboxState: OutboxState;
  uid: string;
}

export interface Initialized {
  type: typeof WALLET_INITIALIZED;
  channelState: ChannelState;

  outboxState: OutboxState;
  uid: string;
  networkId: number;
  adjudicator: string;

  // procedure branches are optional, and exist precisely when that procedure is running
  indirectFunding?: indirectFunding.IndirectFundingState;
}

// ------------
// Constructors
// ------------
export const emptyState = {
  outboxState: EMPTY_OUTBOX_STATE,
  channelState: { initializedChannels: {}, initializingChannels: {} },
};

export function waitForLogin(): WaitForLogin {
  return { type: WAIT_FOR_LOGIN, ...emptyState };
}

export function metaMaskError(params: Properties<MetaMaskError>): MetaMaskError {
  const { outboxState, channelState } = params;
  return { type: METAMASK_ERROR, outboxState, channelState };
}

export function waitForAdjudicator(params: Properties<WaitForAdjudicator>): WaitForAdjudicator {
  const { outboxState, channelState, uid } = params;
  return { type: WAIT_FOR_ADJUDICATOR, outboxState, channelState, uid };
}

export function initialized(params: Properties<Initialized>): Initialized {
  const { outboxState, channelState, uid, networkId, adjudicator } = params;
  return {
    type: WALLET_INITIALIZED,
    channelState,
    outboxState,
    uid,
    networkId,
    adjudicator,
  };
}

export function getChannelStatus(state: WalletState, channelId: string): ChannelStatus {
  return state.channelState.initializedChannels[channelId];
}

export { indirectFunding };
