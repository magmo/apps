import { WalletAction, CommitmentReceived, isCommonAction } from '../../../actions';
import { ActionConstructor } from '../../../utils';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';

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
  ...p,
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED',
});

export const concludeApproved: ActionConstructor<ConcludeApproved> = p => ({
  ...p,
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED',
});

export const defundChosen: ActionConstructor<DefundChosen> = p => ({
  ...p,
  type: 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN',
});

export const acknowledged: ActionConstructor<Acknowledged> = p => ({
  ...p,
  type: 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED',
});

// -------
// Unions and Guards
// -------

export type ConcludingInstigatorAction =
  | DefundingAction
  | Cancelled
  | ConcludeApproved
  | DefundChosen
  | Acknowledged
  | CommitmentReceived;

export const isConcludingInstigatorAction = (
  action: WalletAction,
): action is ConcludingInstigatorAction => {
  return (
    isDefundingAction(action) ||
    isCommonAction(action) ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_APPROVED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED'
  );
};
