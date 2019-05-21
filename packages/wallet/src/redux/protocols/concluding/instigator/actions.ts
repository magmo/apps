import { WalletAction, CommitmentReceived, COMMITMENT_RECEIVED } from '../../../actions';
import { ActionConstructor } from '../../../utils';

// -------
// Actions
// -------
export interface Cancelled {
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED';
  processId: string;
}
export interface ConcludeApproved {
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED';
  processId: string;
}

export interface DefundChosen {
  type: 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN';
  processId: string;
}

export interface Acknowledged {
  type: 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED';
  processId: string;
}

// -------
// Constructors
// -------

export const cancelled: ActionConstructor<Cancelled> = p => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED',
  processId: p.processId,
});

export const concludeApproved: ActionConstructor<ConcludeApproved> = p => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED',
  processId: p.processId,
});

export const defundChosen: ActionConstructor<DefundChosen> = p => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN',
  processId: p.processId,
});

export const acknowledged: ActionConstructor<Acknowledged> = p => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED',
  processId: p.processId,
});

// -------
// Unions and Guards
// -------

export type ConcludingAction =
  | Cancelled
  | ConcludeApproved
  | CommitmentReceived
  | DefundChosen
  | Acknowledged
  | CommitmentReceived;

export const isConcludingAction = (action: WalletAction): action is ConcludingAction => {
  if (action.type === COMMITMENT_RECEIVED) {
    return true;
  }
  return (
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED'
  );
};
