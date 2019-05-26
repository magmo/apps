import { CommitmentReceived, WalletAction, ChallengeCreatedEvent } from '../../actions';
import { CommitmentType } from 'fmg-core';
import { Commitment, SignedCommitment } from 'src/domain';
import { ActionConstructor } from 'src/redux/utils';

// -------
// Actions
// -------

export interface UpdateConfirmed {
  type: 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED';
  commitmentType: CommitmentType.App | CommitmentType.Conclude;
  signedCommitment: SignedCommitment;
}

export interface ChallengeChosen {
  type: 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN';
  challengeCommitment: Commitment;
}

export interface Acknowledged {
  type: 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED';
}

// --------
// Constructors
// --------

export const updateConfirmed: ActionConstructor<UpdateConfirmed> = p => {
  return { ...p, type: 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED' };
};

export const challengeChosen: ActionConstructor<ChallengeChosen> = p => {
  return { ...p, type: 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN' };
};

export const acknowledged: ActionConstructor<Acknowledged> = p => {
  return { ...p, type: 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED' };
};

// --------
// Unions and Guards
// --------

export type IndirectDefundingAction =
  | CommitmentReceived
  | UpdateConfirmed
  | ChallengeChosen
  | ChallengeCreatedEvent
  | Acknowledged;

export function isIndirectDefundingAction(action: WalletAction): action is IndirectDefundingAction {
  return (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' ||
    action.type === 'WALLET.ADJUDICATOR.CHALLENGE_CREATED_EVENT' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED'
  );
}
