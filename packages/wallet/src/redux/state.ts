import {
  OutboxState,
  emptyDisplayOutboxState,
  queueMessage as queueMessageOutbox,
  queueTransaction as queueTransactionOutbox,
} from './outbox/state';
import { ChannelStore } from './channel-store';
import { Properties } from './utils';
import * as NewLedgerChannel from './protocols/new-ledger-channel/states';
import { WalletEvent } from 'magmo-wallet-client';
import { TransactionRequest } from 'ethers/providers';
import { AdjudicatorState } from './adjudicator-state/state';
import { ProcessProtocol, ProtocolLocator } from '../communication';
import {
  TerminalApplicationState,
  isTerminalApplicationState,
  isApplicationState,
} from './protocols/application/states';
import {
  TerminalFundingState,
  isFundingState,
  isTerminalFundingState,
} from './protocols/funding/states';
import { ProtocolState } from './protocols';
import {
  isDefundingState,
  isTerminalDefundingState,
  TerminalDefundingState,
} from './protocols/defunding/states';
import {
  TerminalConcludingState,
  isConcludingState,
  isTerminalConcludingState,
} from './protocols/concluding/states';

export type WalletState = WaitForLogin | MetaMaskError | Initialized;

// -----------
// State types
// -----------
export const WAIT_FOR_LOGIN = 'INITIALIZING.WAIT_FOR_LOGIN';
export const METAMASK_ERROR = 'INITIALIZING.METAMASK_ERROR';
export const WALLET_INITIALIZED = 'WALLET.INITIALIZED';

// ------
// States
// ------

export interface SharedData {
  channelStore: ChannelStore;
  outboxState: OutboxState;
  channelSubscriptions: ChannelSubscriptions;
  adjudicatorState: AdjudicatorState;
  fundingState: FundingState;
  currentProcessId?: string;
  address: string;
  privateKey: string;
}

export interface ChannelSubscriptions {
  [channelId: string]: ChannelSubscriber[];
}
export interface ChannelSubscriber {
  protocolLocator: ProtocolLocator;
  processId: string;
}
export interface WaitForLogin {
  type: typeof WAIT_FOR_LOGIN;
  address?: string;
  privateKey?: string;
  outboxState: OutboxState;
}

export interface MetaMaskError {
  type: typeof METAMASK_ERROR;
  outboxState: OutboxState;
}

export interface Initialized extends SharedData {
  type: typeof WALLET_INITIALIZED;
  uid: string;
  processStore: ProcessStore;

  address: string;
  privateKey: string;
}

// TODO: Once these are fleshed out they should be moved to their own file.
export function registerChannelToMonitor(
  data: SharedData,
  processId: string,
  channelId: string,
  protocolLocator: ProtocolLocator,
): SharedData {
  const subscribers = data.channelSubscriptions[channelId]
    ? [...data.channelSubscriptions[channelId]]
    : [];
  subscribers.push({ processId, protocolLocator });
  return {
    ...data,
    channelSubscriptions: {
      ...data.channelSubscriptions,
      [channelId]: subscribers,
    },
  };
}

export function unregisterAllChannelToMonitor(
  data: SharedData,
  processId: string,
  protocolLocator: ProtocolLocator,
): SharedData {
  const modifiedSubscriptions = {};
  for (const channelId of Object.keys(data.channelSubscriptions)) {
    const subscribers = data.channelSubscriptions[channelId].filter(
      s => s.processId !== processId && s.protocolLocator !== protocolLocator,
    );
    modifiedSubscriptions[channelId] = subscribers;
  }
  return {
    ...data,
    channelSubscriptions: modifiedSubscriptions,
  };
}

export interface ProcessStore {
  [processId: string]: ProcessState;
}
export interface ProcessState {
  processId: string;
  protocol: ProcessProtocol;
  protocolState: any;
  channelsToMonitor: string[];
}

export interface FundingState {
  [channelId: string]: ChannelFundingState;
}

export interface ChannelFundingState {
  directlyFunded: boolean;
  fundingChannel?: string;
  guarantorChannel?: string;
}

// ------------
// Constructors
// ------------
export const emptySharedData = (address: string, privateKey: string): SharedData => {
  return {
    address,
    privateKey,
    outboxState: emptyDisplayOutboxState(),
    channelStore: {},
    channelSubscriptions: {},
    adjudicatorState: {},
    fundingState: {},
  };
};

export function sharedData(params: SharedData): SharedData {
  return {
    ...params,
  };
}

export function waitForLogin(): WaitForLogin {
  return { outboxState: emptyDisplayOutboxState(), type: WAIT_FOR_LOGIN };
}

export function metaMaskError(params: Properties<MetaMaskError>): MetaMaskError {
  return { ...params, type: METAMASK_ERROR };
}
export function initialized(params: Properties<Initialized>): Initialized {
  return {
    ...params,
    ...sharedData(params),
    type: WALLET_INITIALIZED,
  };
}

// -------------------
// Getters and setters
// -------------------
export function setChannelStore(state: SharedData, channelStore: ChannelStore): SharedData {
  return { ...state, channelStore };
}
export function queueMessage(state: SharedData, message: WalletEvent): SharedData {
  return { ...state, outboxState: queueMessageOutbox(state.outboxState, message) };
}

export function setFundingState(
  state: SharedData,
  channelId: string,
  fundingState: ChannelFundingState,
) {
  return { ...state, fundingState: { ...state.fundingState, [channelId]: fundingState } };
}

export function getPrivateKey(state: SharedData): string {
  return state.privateKey;
}

export function queueTransaction(
  state: SharedData,
  transaction: TransactionRequest,
  processId: string,
): SharedData {
  return {
    ...state,
    outboxState: queueTransactionOutbox(state.outboxState, transaction, processId),
  };
}

export { NewLedgerChannel };

export function isTerminalProtocolState(
  protocolState: ProtocolState,
): protocolState is
  | TerminalApplicationState
  | TerminalFundingState
  | TerminalDefundingState
  | TerminalConcludingState {
  return (
    (isApplicationState(protocolState) && isTerminalApplicationState(protocolState)) ||
    (isFundingState(protocolState) && isTerminalFundingState(protocolState)) ||
    (isDefundingState(protocolState) && isTerminalDefundingState(protocolState)) ||
    (isConcludingState(protocolState) && isTerminalConcludingState(protocolState))
  );
}
