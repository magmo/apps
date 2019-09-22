import { Commitment } from 'fmg-core';
import { State } from 'nitro-protocol/lib/src/contract/state';
import { SignedState } from 'nitro-protocol';
import { ChallengeResponseRequested } from './wallet-events';

export enum PlayerIndex {
  'A' = 0,
  'B' = 1,
}

export const INITIALIZE_REQUEST = 'WALLET.INITIALIZE_REQUEST';
export const initializeRequest = (userId: string) => ({
  type: INITIALIZE_REQUEST as typeof INITIALIZE_REQUEST,
  userId,
});
export type InitializeRequest = ReturnType<typeof initializeRequest>;

// FUNDING
// =======

// TODO: after the refactor we should already have all these details. At most this request
// would need the channelId (and we don't even need that while we do one channel per wallet)
export const FUNDING_REQUEST = 'WALLET.FUNDING.REQUEST';
export const fundingRequest = (
  channelId: string,
  myAddress: string,
  opponentAddress: string,
  myBalance: string,
  opponentBalance: string,
  playerIndex: PlayerIndex,
) => ({
  type: FUNDING_REQUEST as typeof FUNDING_REQUEST,
  channelId,
  myAddress,
  opponentAddress,
  myBalance,
  opponentBalance,
  playerIndex,
});
export type FundingRequest = ReturnType<typeof fundingRequest>;

// SIGNATURE
// =========

export interface SignStateRequest {
  type: 'WALLET.SIGNATURE.REQUEST';
  state: State;
}

export const signStateRequest = (state: State) => ({
  type: 'WALLET.SIGNATURE.REQUEST',
  state,
});

// STORING

export interface ValidateAndSaveRequest {
  type: 'WALLET.STORE.REQUEST';
  signedState: SignedState;
}

export const validateAndSaveRequest = (signedState: SignedState) => ({
  type: 'WALLET.STORE.REQUEST',
  signedState,
});

// WITHDRAWAL
// ==========

export const WITHDRAWAL_REQUEST = 'WALLET.WITHDRAWAL.REQUEST';
export const withdrawalRequest = (signedState: SignedState) => ({
  type: WITHDRAWAL_REQUEST as typeof WITHDRAWAL_REQUEST,
  signedState,
});
export type WithdrawalRequest = ReturnType<typeof withdrawalRequest>;

// Challenge
// =========

export const CREATE_CHALLENGE_REQUEST = 'WALLET.CHALLENGE.CREATE';
export const createChallenge = (channelId: string) => ({
  type: CREATE_CHALLENGE_REQUEST as typeof CREATE_CHALLENGE_REQUEST,
  channelId,
});
export type CreateChallengeRequest = ReturnType<typeof createChallenge>;

export const RESPOND_TO_CHALLENGE = 'WALLET.RESPOND_TO_CHALLENGE';
export const respondToChallenge = (signedState: SignedState) => ({
  signedState,
  type: RESPOND_TO_CHALLENGE as typeof RESPOND_TO_CHALLENGE,
});
export type RespondToChallenge = ReturnType<typeof respondToChallenge>;

export const CONCLUDE_CHANNEL_REQUEST = 'WALLET.CHANNEL.REQUEST.CONCLUDE';
export const concludeChannelRequest = (channelId: string) => ({
  channelId,
  type: CONCLUDE_CHANNEL_REQUEST as typeof CONCLUDE_CHANNEL_REQUEST,
});
export type ConcludeChannelRequest = ReturnType<typeof concludeChannelRequest>;

// Wallet-to-wallet communication
// =========

// Called when a "wallet message" is received from the opponent.
// By "wallet message" we mean a message that was created directly from the opponent's
// wallet meant for wallet-to-wallet communication (e.g. communicating the address of the
// adjudicator).
export const RECEIVE_MESSAGE = 'WALLET.MESSAGING.RECEIVE_MESSAGE';
export const receiveMessage = (messagePayload: any) => ({
  type: RECEIVE_MESSAGE as typeof RECEIVE_MESSAGE,
  messagePayload,
});
export type ReceiveMessage = ReturnType<typeof receiveMessage>;

// Requests
// ========
export type WalletInstruction =
  | ConcludeChannelRequest
  | FundingRequest
  | SignStateRequest
  | ValidateAndSaveRequest
  | WithdrawalRequest
  | CreateChallengeRequest
  | ChallengeResponseRequested
  | InitializeRequest
  | RespondToChallenge
  | ReceiveMessage;
