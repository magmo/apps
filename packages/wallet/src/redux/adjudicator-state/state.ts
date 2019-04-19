import { Commitment } from 'fmg-core/lib/commitment';

export interface AdjudicatorState {
  [channelId: string]: AdjudicatorChannelState;
}
export interface AdjudicatorChannelState {
  balance: string;
  concluded: boolean;
  challenge?: {
    expiresAt: number;
    challengeCommitment: Commitment;
  };
}
