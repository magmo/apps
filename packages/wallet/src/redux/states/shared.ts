import { TransactionRequest } from 'ethers/providers';
import { WalletEvent, DisplayAction } from 'magmo-wallet-client';
import { Action } from 'redux';
import { Commitment } from 'fmg-core';

export interface OutboxState {
  displayOutbox?: DisplayAction;
  messageOutbox?: WalletEvent;
  transactionOutbox?: TransactionRequest;
}

export type SideEffect = DisplayAction | WalletEvent | TransactionRequest;
export interface NextChannelState<T extends ChannelState> extends OutboxState {
  channelState: T;
}

export interface ChannelState {
  address: string;
  privateKey: string;
}

export interface Base {
  channelState?: ChannelState;
  outboxState?: OutboxState;
}

export interface LoggedIn extends Base {
  uid: string;
}

export interface AddressExists extends LoggedIn {
  networkId: number;
  adjudicator: string;
}

export interface HasChannel<T extends ChannelState> extends AddressExists {
  channelState: T;
}

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

export interface FirstMoveSent extends ChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  lastCommitment: SignedCommitment;
  unhandledAction?: Action;
  requestedTotalFunds: string;
  requestedYourDeposit: string;
}
export interface ChannelOpen extends FirstMoveSent {
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
export function base<T extends Base>(params: T): Base {
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

export function baseChannelState<T extends ChannelState>(params: T): ChannelState {
  const { address, privateKey } = params;
  return { address, privateKey };
}

export function firstMoveSent<T extends FirstMoveSent>(params: T): FirstMoveSent {
  const {
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    lastCommitment: lastPosition,
    libraryAddress,
    unhandledAction,
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
    unhandledAction,
    requestedTotalFunds,
    requestedYourDeposit,
  };
}

export function channelOpen<T extends ChannelOpen>(params: T): ChannelOpen {
  return { ...firstMoveSent(params), penultimateCommitment: params.penultimateCommitment };
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
