import { Properties as P } from '../../utils';

export type ResigningState = NonTerminalState | TerminalState;
export type ResigningStateType = ResigningState['type'];

export type NonTerminalState = 
    | ConfirmResignation
    | WaitForOpponentConclude
    | AcknowledgeChannelClosed
    | Defund

export type TerminalState = Success | Failure;

export type FailureReason =
  | 'NotYourTurn';

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
    reason: FailureReason;
  }
  
  export interface Success {
    type: 'Success';
  }

// -------
// Helpers
// -------

export function isTerminal(state: ResigningState): state is Failure | Success {
    return state.type === 'Failure' || state.type === 'Success';
  }
  
  export function isSuccess(state: ResigningState): state is Success {
    return state.type === 'Success';
  }
  
  export function isFailure(state: ResigningState): state is Failure {
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
  
  export function failure(p: P<Failure>): Failure {
    const { reason } = p;
    return { type: 'Failure', reason };
  }
