import { WalletAction } from '../../../actions';

export type ConcludingAction = ConcludeSent | DefundChosen | Acknowledged;

export interface ConcludeSent {
  type: 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_SENT';
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

// --------
// Creators
// --------

export const concludeSent = (processId: string): ConcludeSent => ({
  type: 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_SENT',
  processId,
});

export const defundChosen = (processId: string): DefundChosen => ({
  type: 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN',
  processId,
});

export const acknowledged = (processId: string): Acknowledged => ({
  type: 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED',
  processId,
});

// --------
// Helpers
// --------

export const isConcludingAction = (action: WalletAction): action is ConcludingAction => {
  return (
    action.type === 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_SENT' ||
    action.type === 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED'
  );
};
