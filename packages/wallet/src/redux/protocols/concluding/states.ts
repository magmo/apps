import { Properties as P } from '../../utils';

export type ConcludingState = NonTerminalState | PreTerminalState | TerminalState;
export type ConcludingStateType = ConcludingState['type'];

export type NonTerminalState =
  | AcknowledgeConcludingImpossible
  | ApproveConcluding
  | WaitForOpponentConclude
  | AcknowledgeChannelConcluded
  | AcknowledgeChannelDoesntExist
  | AcknowledgeDefundFailed
  | WaitForDefund
  | AcknowledgeChannelDoesntExist
  | AcknowledgeDefundFailed
  | AcknowledgeConcludingImpossible;

export type PreTerminalState =
  | AcknowledgeChannelDoesntExist
  | AcknowledgeDefundFailed
  | AcknowledgeConcludingImpossible;

export type TerminalState = Success | Failure;

export type FailureReason =
  | 'NotYourTurn'
  | 'ChannelDoesntExist'
  | 'ConcludeCancelled'
  | 'DefundFailed';

export interface AcknowledgeConcludingImpossible {
  type: 'AcknowledgeConcludingImpossible';
  processId: string;
}
export interface ApproveConcluding {
  type: 'ApproveConcluding';
  processId: string;
}

export interface WaitForOpponentConclude {
  type: 'WaitForOpponentConclude';
  processId: string;
}

export interface AcknowledgeChannelConcluded {
  type: 'AcknowledgeChannelConcluded';
  processId: string;
}

export interface AcknowledgeChannelDoesntExist {
  type: 'AcknowledgeChannelDoesntExist';
  processId: string;
}

export interface AcknowledgeDefundFailed {
  type: 'AcknowledgeDefundFailed';
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

export function isTerminal(state: ConcludingState): state is Failure | Success {
  return state.type === 'Failure' || state.type === 'Success';
}

export function isSuccess(state: ConcludingState): state is Success {
  return state.type === 'Success';
}

export function isFailure(state: ConcludingState): state is Failure {
  return state.type === 'Failure';
}

// ------------
// Constructors
// ------------
export function acknowledgeConcludingImpossible(
  p: P<AcknowledgeConcludingImpossible>,
): AcknowledgeConcludingImpossible {
  const { processId } = p;
  return { type: 'AcknowledgeConcludingImpossible', processId };
}

export function approveConcluding(p: P<ApproveConcluding>): ApproveConcluding {
  const { processId } = p;
  return { type: 'ApproveConcluding', processId };
}

export function waitForOpponentConclude(p: P<WaitForOpponentConclude>): WaitForOpponentConclude {
  const { processId } = p;
  return { type: 'WaitForOpponentConclude', processId };
}

export function acknowledgeChannelConcluded(
  p: P<AcknowledgeChannelConcluded>,
): AcknowledgeChannelConcluded {
  const { processId } = p;
  return { type: 'AcknowledgeChannelConcluded', processId };
}

export function acknowledgeChannelDoesntExist(
  p: P<AcknowledgeChannelDoesntExist>,
): AcknowledgeChannelDoesntExist {
  const { processId } = p;
  return { type: 'AcknowledgeChannelDoesntExist', processId };
}

export function acknowledgeDefundFailed(p: P<AcknowledgeDefundFailed>): AcknowledgeDefundFailed {
  const { processId } = p;
  return { type: 'AcknowledgeDefundFailed', processId };
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
