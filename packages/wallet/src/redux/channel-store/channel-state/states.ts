import { SignedCommitment, getChannelId, Commitment } from '../../../domain';

export type Round = SignedCommitment[];

export interface ChannelState {
  address: string;
  privateKey: string;
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  currentRound: Round;
  funded: boolean;
}

export type OpenChannelState = ChannelState;

export function getLastCommitment(state: ChannelState): Commitment {
  return state.currentRound.slice(-1)[0].commitment;
}

export function getPenultimateCommitment(state: ChannelState): Commitment {
  return state.currentRound.slice(-2)[0].commitment;
}

// -------
// Helpers
// -------

export function initializeChannel(
  signedCommitment: SignedCommitment,
  address: string,
  privateKey: string,
): ChannelState {
  const { commitment } = signedCommitment;
  const { turnNum, channel } = commitment;
  const ourIndex = commitment.destination.indexOf(address);
  const channelId = getChannelId(commitment);
  return {
    address,
    privateKey,
    turnNum,
    ourIndex,
    libraryAddress: channel.channelType,
    participants: channel.participants as [string, string],
    channelNonce: channel.nonce,
    channelId,
    funded: false,
    currentRound: [signedCommitment],
  };
}

// Pushes a commitment onto the state, updating penultimate/last commitments and the turn number
export function pushCommitment(
  state: ChannelState,
  signedCommitment: SignedCommitment,
): ChannelState {
  const lastRound = [...state.currentRound];
  lastRound.shift();
  lastRound.push(signedCommitment);
  const turnNum = signedCommitment.commitment.turnNum;
  return { ...state, currentRound: lastRound, turnNum };
}

export function ourTurn(state: ChannelState) {
  const { turnNum, participants, ourIndex } = state;
  const numParticipants = participants.length;
  return turnNum % numParticipants !== ourIndex;
}

export function isFullyOpen(state: ChannelState): state is OpenChannelState {
  return state.participants.length === state.currentRound.length;
}

export function theirAddress(state: ChannelState): string {
  const { participants, ourIndex } = state;
  const theirIndex = 1 - ourIndex; // todo: only two player channels
  return participants[theirIndex];
}
