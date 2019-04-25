import { Commitment as C, CommitmentType as CT } from 'fmg-core/lib/commitment';

export type Commitment = C;
export const CommitmentType = CT;

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}
