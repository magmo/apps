import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { Commitment } from 'fmg-core';
import { WalletAction } from '../actions';

export interface OutboxState {
  displayOutbox?: DisplayAction;
  messageOutbox?: WalletEvent;
  transactionOutbox?: TransactionRequest;
}

export type SideEffect = DisplayAction | WalletEvent | TransactionRequest;
export interface NextChannelState<T extends BaseChannelState> extends OutboxState {
  channelState: T;
  unhandledAction?: WalletAction;
}

export interface WalletState {
  channelState?: BaseChannelState;
  outboxState?: OutboxState;
}

export interface LoggedIn extends WalletState {
  uid: string;
}

export interface AddressExists extends LoggedIn {
  networkId: number;
  adjudicator: string;
}

export interface HasChannel<T extends BaseChannelState> extends AddressExists {
  channelState: T;
}

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

export interface BaseChannelState {
  address: string;
  privateKey: string;
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  lastCommitment: SignedCommitment;
  requestedTotalFunds: string;
  requestedYourDeposit: string;
}
export interface ChannelOpen extends BaseChannelState {
  penultimateCommitment: SignedCommitment;
}
export interface ChannelOpenAndTransactionExists extends ChannelOpen {
  transactionHash: string;
}
export interface TransactionExists {
  transactionHash: string;
}
export interface ChallengeExists extends ChannelOpen {
  challengeExpiry?: number;
}

export interface UserAddressExists extends ChannelOpen {
  userAddress: string;
}

// creators
export function base<T extends WalletState>(params: T): WalletState {
  const { outboxState, channelState } = params;
  return { outboxState, channelState };
}

export function loggedIn<T extends LoggedIn>(params: T): LoggedIn {
  return { ...base(params), uid: params.uid };
}

export function addressExists<T extends AddressExists>(params: T): AddressExists {
  const { networkId, adjudicator } = params;
  return { ...loggedIn(params), networkId, adjudicator };
}

export function baseChannelState<T extends BaseChannelState>(params: T): BaseChannelState {
  const {
    address,
    privateKey,
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    lastCommitment: lastPosition,
    libraryAddress,
    requestedTotalFunds,
    requestedYourDeposit,
  } = params;
  return {
    address,
    privateKey,
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    lastCommitment: lastPosition,
    libraryAddress,
    requestedTotalFunds,
    requestedYourDeposit,
  };
}

export function channelOpen<T extends ChannelOpen>(params: T): ChannelOpen {
  return { ...baseChannelState(params), penultimateCommitment: params.penultimateCommitment };
}

export function challengeExists<T extends ChallengeExists>(params: T): ChallengeExists {
  return {
    ...channelOpen(params),
    challengeExpiry: params.challengeExpiry,
  };
}

export function userAddressExists<T extends UserAddressExists>(params: T): UserAddressExists {
  return {
    ...challengeExists(params),
    userAddress: params.userAddress,
  };
}
