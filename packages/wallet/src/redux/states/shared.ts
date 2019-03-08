import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { Commitment } from 'fmg-core';
import { WalletAction } from '../actions';
import { WaitForChannel } from './opening';

export interface OutboxState {
  displayOutbox?: DisplayAction;
  messageOutbox?: WalletEvent;
  transactionOutbox?: TransactionRequest;
}

export type SideEffect = DisplayAction | WalletEvent | TransactionRequest;
export interface NextChannelState<T extends SharedChannelState> extends OutboxState {
  channelState: T | WaitForChannel;
  unhandledAction?: WalletAction;
}

export interface SharedWalletState {
  channelState?: SharedChannelState;
  outboxState?: OutboxState;
}

export interface LoggedIn extends SharedWalletState {
  uid: string;
}

export interface AdjudicatorKnown extends LoggedIn {
  networkId: number;
  adjudicator: string;
}

export interface SharedChannelState {
  address: string;
  privateKey: string;
}

export interface HasChannel<T extends SharedChannelState> extends AdjudicatorKnown {
  channelState: T;
}

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

export interface FirstCommitmentReceived extends SharedChannelState {
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
export interface ChannelOpen extends FirstCommitmentReceived {
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
export function base<T extends SharedWalletState>(params: T): SharedWalletState {
  const { outboxState, channelState } = params;
  return { outboxState, channelState };
}

export function loggedIn<T extends LoggedIn>(params: T): LoggedIn {
  return { ...base(params), uid: params.uid };
}

export function adjudicatorKnown<T extends AdjudicatorKnown>(params: T): AdjudicatorKnown {
  const { networkId, adjudicator } = params;
  return { ...loggedIn(params), networkId, adjudicator };
}

export function baseChannelState<T extends SharedChannelState>(params: T): SharedChannelState {
  const { address, privateKey } = params;
  return {
    address,
    privateKey,
  };
}

export function firstCommitmentReceived<T extends FirstCommitmentReceived>(
  params: T,
): FirstCommitmentReceived {
  const {
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
    ...baseChannelState(params),
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
  return {
    ...firstCommitmentReceived(params),
    penultimateCommitment: params.penultimateCommitment,
  };
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
