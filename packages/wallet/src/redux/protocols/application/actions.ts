import { Commitment } from '../../../domain';

export const OWN_COMMITMENT_RECEIVED = 'WALLET.APPLICATION.OWN_COMMITMENT_RECEIVED';
export const ownCommitmentReceived = (processId: string, commitment: Commitment) => ({
  type: OWN_COMMITMENT_RECEIVED as typeof OWN_COMMITMENT_RECEIVED,
  processId,
  commitment,
});
export type OwnCommitmentReceived = ReturnType<typeof ownCommitmentReceived>;

export const OPPONENT_COMMITMENT_RECEIVED = 'WALLET.APPLICATION.OPPONENT_COMMITMENT_RECEIVED';
export const opponentCommitmentReceived = (
  processId: string,
  commitment: Commitment,
  signature: string,
) => ({
  type: OPPONENT_COMMITMENT_RECEIVED as typeof OPPONENT_COMMITMENT_RECEIVED,
  processId,
  commitment,
  signature,
});
export type OpponentCommitmentReceived = ReturnType<typeof opponentCommitmentReceived>;

export type ApplicationAction = OpponentCommitmentReceived | OwnCommitmentReceived;
