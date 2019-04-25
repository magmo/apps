import { Commitment as C } from 'fmg-core/lib/commitment';

export type Commitment = C;

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}
