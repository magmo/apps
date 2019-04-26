import { SignedCommitment } from '../../../domain';

export type ChannelState = PartiallyOpenChannelState | OpenChannelState;

interface PartiallyOpenChannelState {
  address: string;
  privateKey: string;
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  lastCommitment: SignedCommitment;
  funded: boolean;
  type: string;
}

interface OpenChannelState extends PartiallyOpenChannelState {
  penultimateCommitment: SignedCommitment;
  type: string;
}

// -------
// Helpers
// -------

// Pushes a commitment onto the state, updating penultimate/last commitments and the turn number
export function pushCommitment(
  state: ChannelState,
  signedCommitment: SignedCommitment,
): ChannelState {
  const penultimateCommitment = state.lastCommitment;
  const lastCommitment = signedCommitment;
  const turnNum = signedCommitment.commitment.turnNum;
  return { ...state, penultimateCommitment, lastCommitment, turnNum };
}

export function ourTurn(state: ChannelState) {
  const { turnNum, participants, ourIndex } = state;
  const numParticipants = participants.length;
  return turnNum % numParticipants !== ourIndex;
}
