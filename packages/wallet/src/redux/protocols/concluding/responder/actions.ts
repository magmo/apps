import { CommitmentReceived, WalletAction } from '../../../actions';
import { ActionConstructor } from '../../../utils';

// -------
// Actions
// -------
export interface ConcludeApproved {
  type: 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_APPROVED';
  processId: string;
}

export interface DefundChosen {
  type: 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN';
  processId: string;
}

export interface Acknowledged {
  type: 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED';
  processId: string;
}

// -------
// Constructors
// -------

export const concludeApproved: ActionConstructor<ConcludeApproved> = p => ({
  type: 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_APPROVED',
  processId: p.processId,
});

export const defundChosen: ActionConstructor<DefundChosen> = p => ({
  type: 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN',
  processId: p.processId,
});

export const acknowledged: ActionConstructor<Acknowledged> = p => ({
  type: 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED',
  processId: p.processId,
});

// -------
// Unions and Guards
// -------

export type ConcludingAction = CommitmentReceived | ConcludeApproved | DefundChosen | Acknowledged;

export const isConcludingAction = (action: WalletAction): action is ConcludingAction => {
  return (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' ||
    action.type === 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_APPROVED' ||
    action.type === 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED'
  );
};
