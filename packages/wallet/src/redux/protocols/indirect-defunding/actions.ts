import { CommitmentReceived, WalletAction, LedgerDisputeDetected } from '../../actions';
import { CommitmentType } from 'fmg-core';
import { ActionConstructor } from '../../../redux/utils';

// -------
// Actions
// -------

export interface UpdateConfirmed {
  type: 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED';
  commitmentType: CommitmentType.App | CommitmentType.Conclude;
  processId: string;
}
export interface ChallengeChosen {
  type: 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN';
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
  | Acknowledged
  | LedgerDisputeDetected;

export function isIndirectDefundingAction(action: WalletAction): action is IndirectDefundingAction {
  return (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.UPDATE_CONFIRMED' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.CHALLENGE_CHOSEN' ||
    action.type === 'WALLET.INDIRECT_DEFUNDING.ACKNOWLEDGED' ||
    action.type === 'WALLET.COMMON.LEDGER_DISPUTE_DETECTED'
  );
}
