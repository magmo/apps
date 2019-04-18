import { Commitment } from 'fmg-core/lib/commitment';

export interface AdjudicatorState {
  [channelId: string]: AdjudicatorChannelState;
}
export interface AdjudicatorChannelState {
  balance: string;
  outcome?: {
    allocation: string[];
    destination: string[];
  };
  challenge?: {
    allocation: string[];
    destination: string[];
    expiresAt: number;
    challengeCommitment: Commitment;
  };
}
