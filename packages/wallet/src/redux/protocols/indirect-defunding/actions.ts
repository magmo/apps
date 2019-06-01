import { CommitmentReceived, WalletAction } from '../../actions';
import { CommitmentType } from 'fmg-core';
import { Commitment, SignedCommitment } from '../../../domain';
import { ActionConstructor } from '../../../redux/utils';

// -------
// Actions
// -------

export interface UpdateConfirmed {
  type: 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED';
  commitmentType: CommitmentType.App | CommitmentType.Conclude;
  signedCommitment: SignedCommitment;
  processId: string;
}

export interface LedgerChallengeCreated {
  type: 'WALLET.INDIRECT_DEFUNDING.LEDGER_CHALLENGE_CREATED';
  commitment: Commitment;
  expiresAt: number;
  channelId: string;
  processId: string;
}
export interface ChallengeChosen {
  type: 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN';
  challengeCommitment: Commitment;
  processId: string;
}

export interface Acknowledged {
  type: 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED';
  processId: string;
}

// --------
// Constructors
// --------

export const updateConfirmed: ActionConstructor<UpdateConfirmed> = p => {
  return { ...p, type: 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED' };
};

export const ledgerChallengeCreated: ActionConstructor<LedgerChallengeCreated> = p => {
  return { ...p, type: 'WALLET.INDIRECT_DEFUNDING.LEDGER_CHALLENGE_CREATED' };
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
  | LedgerChallengeCreated
  | Acknowledged;

export function isIndirectDefundingAction(action: WalletAction): action is IndirectDefundingAction {
  return (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.LEDGER_CHALLENGE_CREATED' ||
    action.type === 'WALLET.ADJUDICATOR.CHALLENGE_CREATED_EVENT' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED'
  );
}
