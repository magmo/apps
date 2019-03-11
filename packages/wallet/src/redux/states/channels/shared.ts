import { Commitment } from 'fmg-core';

export interface SharedChannelState {
  address: string;
  privateKey: string;
}

export const CHANNEL_INITIALIZED = 'CHANNEL.INITIALIZED';

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

export const DIRECT_FUNDING = 'FUNDING_TYPE.DIRECT';
export interface SharedDirectFundingState {
  type: typeof DIRECT_FUNDING;
  stage: any;
  requestedTotalFunds: string;
  requestedYourDeposit: string;
}

// This type alias will eventually become SharedDirectFundingState | SharedIndirectFundingState
type SharedFundingState = SharedDirectFundingState;

export interface FirstCommitmentReceived extends SharedChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  lastCommitment: SignedCommitment;
  fundingState: SharedFundingState;
}
export interface ChannelOpen extends FirstCommitmentReceived {
  penultimateCommitment: SignedCommitment;
  funded: boolean; // Though this is computable from fundingState, it might be convenient to record this on the top-level of the channel state
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
    fundingState,
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
    fundingState,
  };
}

export function channelOpen<T extends ChannelOpen>(params: T): ChannelOpen {
  return {
    ...firstCommitmentReceived(params),
    penultimateCommitment: params.penultimateCommitment,
    funded: params.funded,
    fundingState: params.fundingState,
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
