import { Commitment } from 'fmg-core';
export interface SharedChannelState {
  address: string;
  privateKey: string;
}

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

export interface ChannelInitialized extends SharedChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;

  funded: boolean;
}

export interface FirstCommitmentReceived extends ChannelInitialized {
  lastCommitment: SignedCommitment;
}
export interface ChannelOpen extends FirstCommitmentReceived {
  penultimateCommitment: SignedCommitment;
}

export interface ChallengeExists extends ChannelOpen {
  challengeExpiry?: number;
}

export interface UserAddressExists extends ChannelOpen {
  userAddress: string;
}

// creators
export function baseChannelState<T extends SharedChannelState>(params: T): SharedChannelState {
  const { address, privateKey } = params;
  return {
    address,
    privateKey,
  };
}

export function channelInitialized<T extends ChannelInitialized>(params: T): ChannelInitialized {
  const {
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
  } = params;
  return {
    ...baseChannelState(params),
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
  };
}

export function firstCommitmentReceived<T extends FirstCommitmentReceived>(
  params: T,
): FirstCommitmentReceived {
  const { lastCommitment } = params;
  return {
    ...channelInitialized(params),
    lastCommitment,
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
