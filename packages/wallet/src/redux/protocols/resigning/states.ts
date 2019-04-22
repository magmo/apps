import { Properties as P } from '../../utils';

export type ResignationState = 
    | ConfirmResignation
    | WaitForOpponentConclude
    | AcknowledgeChannelClosed
    | Defund
    | Failure
    | Success;
export interface ConfirmResignation {
    type: 'ConfirmResignation';
    processId: string;
}

export interface WaitForOpponentConclude {
    type: 'WaitForOpponentConclude';
    processId: string;
}

export interface AcknowledgeChannelClosed {
    type: 'AcknowledgeChannelClosed';
    processId: string;
}

export interface Defund {
    type: 'Defund';
    processId: string;
}

export interface Failure {
    type: 'Failure';
    reason: string;
  }
  
  export interface Success {
    type: 'Success';
  }

// -------
// Helpers
// -------

export function isTerminal(state: ResignationState): state is Failure | Success {
    return state.type === 'Failure' || state.type === 'Success';
  }
  
  export function isSuccess(state: ResignationState): state is Success {
    return state.type === 'Success';
  }
  
  export function isFailure(state: ResignationState): state is Failure {
    return state.type === 'Failure';
  }

// ------------
// Constructors
// ------------

export function confirmResignation(p: P<ConfirmResignation>): ConfirmResignation {
    const { processId } = p;
    return { type: 'ConfirmResignation', processId};
}

export function waitForOpponentConclude(p: P<WaitForOpponentConclude>): WaitForOpponentConclude {
    const { processId } = p;
    return { type: 'WaitForOpponentConclude', processId};
}

export function acknowledgeChannelClosed(p: P<AcknowledgeChannelClosed>): AcknowledgeChannelClosed {
    const { processId } = p;
    return { type: 'AcknowledgeChannelClosed', processId};
}

export function defund(p: P<Defund>): Defund {
    const { processId } = p;
    return { type: 'Defund', processId};
}

export function success(): Success {
    return { type: 'Success' };
  }
  
  export function failure(reason: string): Failure {
    return { type: 'Failure', reason };
  }
