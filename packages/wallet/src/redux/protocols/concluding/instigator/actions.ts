import { WalletAction } from '../../../actions';

export type ConcludingAction =
  | Cancelled
  | ConcludeSent
  | ConcludeReceived
  | DefundChosen
  | Acknowledged;
export interface Cancelled {
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED';
  processId: string;
}

export interface ConcludeSent {
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_SENT';
  processId: string;
}

export interface ConcludeReceived {
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_RECEIVED';
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

// --------
// Creators
// --------

export const cancelled = (processId: string): Cancelled => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED',
  processId,
});

export const concludeSent = (processId: string): ConcludeSent => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_SENT',
  processId,
});

export const concludeReceived = (processId: string): ConcludeReceived => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_RECEIVED',
  processId,
});

export const defundChosen = (processId: string): DefundChosen => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN',
  processId,
});

export const acknowledged = (processId: string): Acknowledged => ({
  type: 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED',
  processId,
});

// --------
// Helpers
// --------

export const isConcludingAction = (action: WalletAction): action is ConcludingAction => {
  return (
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDING_CANCELLED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_SENT' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.CONCLUDE_RECEIVED' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CONCLUDING.INSTIGATOR.ACKNOWLEDGED'
  );
};
