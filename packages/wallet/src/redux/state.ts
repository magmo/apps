import { OutboxState, EMPTY_OUTBOX_STATE } from './outbox/state';
import { FundingState, EMPTY_FUNDING_STATE } from './fundingState/state';
import { ChannelState } from './channelState/state';

export type WalletState = InitializingState | InitializedState;
export type InitializingState = WaitForLogin | WaitForAdjudicator | MetaMaskError;
export type InitializedState = Initialized;

export const INITIALIZING = 'INITIALIZING';
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
  stage: typeof INITIALIZING;
  channelState: ChannelState;
  fundingState: FundingState;
  outboxState: OutboxState;
}

export interface MetaMaskError {
  type: typeof METAMASK_ERROR;
  stage: typeof INITIALIZING;
  channelState: ChannelState;
  fundingState: FundingState;
  outboxState: OutboxState;
}

export interface WaitForAdjudicator {
  type: typeof WAIT_FOR_ADJUDICATOR;
  stage: typeof INITIALIZING;
  channelState: ChannelState;
  fundingState: FundingState;
  outboxState: OutboxState;
  uid: string;
}

export interface Initialized {
  stage: typeof WALLET_INITIALIZED;
  type: typeof WALLET_INITIALIZED;
  channelState: ChannelState;
  fundingState: FundingState;
  outboxState: OutboxState;
  uid: string;
  networkId: number;
  adjudicator: string;
}

// ------------
// Constructors
// ------------

export const emptyState = {
  outboxState: EMPTY_OUTBOX_STATE,
  fundingState: EMPTY_FUNDING_STATE,
  channelState: { initializedChannels: {}, initializingChannels: {} },
};

export function waitForLogin(): WaitForLogin {
  return { type: WAIT_FOR_LOGIN, stage: INITIALIZING, ...emptyState, };
}

export function metaMaskError(params: Properties<MetaMaskError>): MetaMaskError {
  const { outboxState, fundingState, channelState } = params;
  return { type: METAMASK_ERROR, stage: INITIALIZING, outboxState, fundingState, channelState };
}

export function waitForAdjudicator(params: Properties<WaitForAdjudicator>): WaitForAdjudicator {
  const { outboxState, fundingState, channelState, uid } = params;
  return { type: WAIT_FOR_ADJUDICATOR, stage: INITIALIZING, outboxState, fundingState, channelState, uid };
}

export function initialized(params: Properties<Initialized>): Initialized {
  const { outboxState, fundingState, channelState, uid, networkId, adjudicator } = params;
  return {
    stage: WALLET_INITIALIZED,
    type: WALLET_INITIALIZED,
    channelState,
    fundingState,
    outboxState,
    uid,
    networkId,
    adjudicator,
  };
}

type Properties<T> = Pick<T, Exclude<keyof T, 'type' | 'stage'>> & { [x: string]: any };
