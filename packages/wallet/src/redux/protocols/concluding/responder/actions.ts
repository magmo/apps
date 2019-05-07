export type ConcludingAction = Cancelled | ConcludeSent | DefundChosen | Acknowledged;
export interface Cancelled {
  type: 'CONCLUDING.CANCELLED';
  processId: string;
}

export interface ConcludeSent {
  type: 'CONCLUDE.SENT';
  processId: string;
}

export interface DefundChosen {
  type: 'DEFUND.CHOSEN';
  processId: string;
}

export interface Acknowledged {
  type: 'ACKNOWLEDGED';
  processId: string;
}

// --------
// Creators
// --------

export const cancelled = (processId: string): Cancelled => ({
  type: 'CONCLUDING.CANCELLED',
  processId,
});

export const concludeSent = (processId: string): ConcludeSent => ({
  type: 'CONCLUDE.SENT',
  processId,
});

export const defundChosen = (processId: string): DefundChosen => ({
  type: 'DEFUND.CHOSEN',
  processId,
});

export const acknowledged = (processId: string): Acknowledged => ({
  type: 'ACKNOWLEDGED',
  processId,
});
