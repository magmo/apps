export type ResignationAction = 
    | ConcludeSent
    | AcknowledgedResignationImpossible
    | ConcludeReceived
    | DefundChosen
    | DefundNotChosen
    | Defunded;
export interface ConcludeSent {
    type: 'CONCLUDE.SENT';
    processId: string;
}

export interface AcknowledgedResignationImpossible {
    type: 'ACKNOWLEDGE.RESIGNATION.IMPOSSIBLE';
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

export const concludeSent = (processId: string):
ConcludeSent => ({
    type: 'CONCLUDE.SENT',
    processId,
});

export const acknowledgedResignationImpossible = (processId: string):
AcknowledgedResignationImpossible => ({
    type: 'ACKNOWLEDGE.RESIGNATION.IMPOSSIBLE',
    processId,
});

export const concludeReceived = (processId: string):
ConcludeReceived => ({
    type: 'CONCLUDE.RECEIVED',
    processId,
});

export const defundChosen = (processId: string):
DefundChosen => ({
    type: 'DEFUND.CHOSEN',
    processId,
});

export const defundNotChosen = (processId: string):
DefundNotChosen => ({
    type: 'DEFUND.NOT.CHOSEN',
    processId,
});

export const defunded = (processId: string):
Defunded => ({
    type: 'DEFUNDED',
    processId,
});

