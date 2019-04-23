export type ConcludingAction =
  | Cancelled
  | ConcludeSent
  | ConcludingImpossibleAcknowledged
  | ConcludeReceived
  | DefundChosen
  | DefundNotChosen
  | Defunded;
export interface Cancelled {
  type: 'CONCLUDING.CANCELLED';
  processId: string;
}

export interface ConcludeSent {
  type: 'CONCLUDE.SENT';
  processId: string;
}

export interface ConcludingImpossibleAcknowledged {
  type: 'CONCLUDING.IMPOSSIBLE.ACKNOWLEDGED';
  processId: string;
}

export interface ConcludeReceived {
  type: 'CONCLUDE.RECEIVED';
  processId: string;
}

export interface DefundChosen {
  type: 'DEFUND.CHOSEN';
  processId: string;
}

export interface DefundNotChosen {
  type: 'DEFUND.NOT.CHOSEN';
  processId: string;
}

export interface Defunded {
  type: 'DEFUNDED';
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

export const resignationImpossibleAcknowledged = (
  processId: string,
): ConcludingImpossibleAcknowledged => ({
  type: 'CONCLUDING.IMPOSSIBLE.ACKNOWLEDGED',
  processId,
});

export const concludeReceived = (processId: string): ConcludeReceived => ({
  type: 'CONCLUDE.RECEIVED',
  processId,
});

export const defundChosen = (processId: string): DefundChosen => ({
  type: 'DEFUND.CHOSEN',
  processId,
});

export const defundNotChosen = (processId: string): DefundNotChosen => ({
  type: 'DEFUND.NOT.CHOSEN',
  processId,
});

export const defunded = (processId: string): Defunded => ({
  type: 'DEFUNDED',
  processId,
});
