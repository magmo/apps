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
