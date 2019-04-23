import { Properties as P } from '../../utils';

export type ResigningState = NonTerminalState | TerminalState;
export type ResigningStateType = ResigningState['type'];

export type NonTerminalState =
  | AcknowledgeResignationImpossible
  | ApproveResignation
  | WaitForOpponentConclude
  | AcknowledgeChannelClosed
  | WaitForDefund;

export type TerminalState = Success | Failure;

export type FailureReason = 'NotYourTurn';

export interface AcknowledgeResignationImpossible {
  type: 'AcknowledgeResignationImpossible';
  processId: string;
}
export interface ApproveResignation {
  type: 'ApproveResignation';
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

export interface WaitForDefund {
  type: 'WaitForDefund';
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
export function acknowledgeResignationImpossible(
  p: P<AcknowledgeResignationImpossible>,
): AcknowledgeResignationImpossible {
  const { processId } = p;
  return { type: 'AcknowledgeResignationImpossible', processId };
}

export function approveResignation(p: P<ApproveResignation>): ApproveResignation {
  const { processId } = p;
  return { type: 'ApproveResignation', processId };
}

export function waitForOpponentConclude(p: P<WaitForOpponentConclude>): WaitForOpponentConclude {
  const { processId } = p;
  return { type: 'WaitForOpponentConclude', processId };
}

export function acknowledgeChannelClosed(p: P<AcknowledgeChannelClosed>): AcknowledgeChannelClosed {
  const { processId } = p;
  return { type: 'AcknowledgeChannelClosed', processId };
}

export function waitForDefund(p: P<WaitForDefund>): WaitForDefund {
  const { processId } = p;
  return { type: 'WaitForDefund', processId };
}

export function success(): Success {
  return { type: 'Success' };
}

export function failure(p: P<Failure>): Failure {
  const { reason } = p;
  return { type: 'Failure', reason };
}
