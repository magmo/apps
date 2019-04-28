import { Commitment } from '../../../domain';

export type ApplicationAction = OwnCommitmentReceived | OpponentCommitmentReceived;

export interface OwnCommitmentReceived {
  type: 'APPLICATION.OWN_COMMITMENT_RECEIVED';
  processId: string;
  commitment: Commitment;
}

export interface OpponentCommitmentReceived {
  type: 'APPLICATION.OPPONENT_COMMITMENT_RECEIVED';
  processId: string;
  commitment: Commitment;
  signature: string;
}

// --------
// Creators
// --------

export const ownCommitmentReceived = (
  processId: string,
  commitment: Commitment,
): OwnCommitmentReceived => ({
  type: 'APPLICATION.OWN_COMMITMENT_RECEIVED',
  processId,
  commitment,
});

export const opponentCommitmentReceived = (
  processId: string,
  commitment: Commitment,
  signature: string,
): OpponentCommitmentReceived => ({
  type: 'APPLICATION.OPPONENT_COMMITMENT_RECEIVED',
  processId,
  commitment,
  signature,
});
