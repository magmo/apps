import { Constructor } from '../../../utils';
import { DefundingState } from '../../defunding';
export type ConcludingState = NonTerminalState | PreTerminalState | TerminalState;
export type ConcludingStateType = ConcludingState['type'];
import { ProtocolState } from '../..';

export type NonTerminalState =
  | ApproveConcluding
  | WaitForOpponentConclude
  | AcknowledgeConcludeReceived
  | AcknowledgeFailure
  | AcknowledgeSuccess
  | WaitForDefund;

export type PreTerminalState = AcknowledgeSuccess | AcknowledgeFailure;

export type TerminalState = Success | Failure;

export type FailureReason =
  | 'NotYourTurn'
  | 'ChannelDoesntExist'
  | 'ConcludeCancelled'
  | 'DefundFailed';

export interface AcknowledgeSuccess {
  type: 'InstigatorAcknowledgeSuccess';
  processId: string;
  channelId: string;
}
export interface AcknowledgeFailure {
  type: 'InstigatorAcknowledgeFailure';
  reason: FailureReason;
  processId: string;
  channelId: string;
}
export interface ApproveConcluding {
  type: 'InstigatorApproveConcluding';
  processId: string;
  channelId: string;
}

export interface WaitForOpponentConclude {
  type: 'InstigatorWaitForOpponentConclude';
  processId: string;
  channelId: string;
}

export interface AcknowledgeConcludeReceived {
  type: 'InstigatorAcknowledgeConcludeReceived';
  processId: string;
  channelId: string;
}

export interface WaitForDefund {
  type: 'InstigatorWaitForDefund';
  processId: string;
  channelId: string;
  defundingState: DefundingState;
}

export interface Failure {
  type: 'InstigatorFailure';
  reason: FailureReason;
}

export interface Success {
  type: 'InstigatorSuccess';
}

// -------
// Helpers
// -------

export function isTerminal(state: ConcludingState): state is Failure | Success {
  return state.type === 'InstigatorFailure' || state.type === 'InstigatorSuccess';
}

export function isSuccess(state: ConcludingState): state is Success {
  return state.type === 'InstigatorSuccess';
}

export function isFailure(state: ConcludingState): state is Failure {
  return state.type === 'InstigatorFailure';
}

export function isConcludingInstigatorState(state: ProtocolState): state is ConcludingState {
  return (
    state.type === 'InstigatorAcknowledgeSuccess' ||
    state.type === 'InstigatorAcknowledgeFailure' ||
    state.type === 'InstigatorApproveConcluding' ||
    state.type === 'InstigatorWaitForOpponentConclude' ||
    state.type === 'InstigatorAcknowledgeConcludeReceived' ||
    state.type === 'InstigatorWaitForDefund'
  );
}

// ------------
// Constructors
// ------------

export const approveConcluding: Constructor<ApproveConcluding> = p => {
  const { processId, channelId } = p;
  return { type: 'InstigatorApproveConcluding', processId, channelId };
};

export const waitForOpponentConclude: Constructor<WaitForOpponentConclude> = p => {
  const { processId, channelId } = p;
  return { type: 'InstigatorWaitForOpponentConclude', processId, channelId };
};

export const acknowledgeConcludeReceived: Constructor<AcknowledgeConcludeReceived> = p => {
  const { processId, channelId } = p;
  return { type: 'InstigatorAcknowledgeConcludeReceived', processId, channelId };
};

export const acknowledgeSuccess: Constructor<AcknowledgeSuccess> = p => {
  const { processId, channelId } = p;
  return { type: 'InstigatorAcknowledgeSuccess', processId, channelId };
};

export const acknowledgeFailure: Constructor<AcknowledgeFailure> = p => {
  const { processId, channelId, reason } = p;
  return { type: 'InstigatorAcknowledgeFailure', processId, channelId, reason };
};

export const waitForDefund: Constructor<WaitForDefund> = p => {
  const { processId, channelId, defundingState } = p;
  return { type: 'InstigatorWaitForDefund', processId, channelId, defundingState };
};

export function success(): Success {
  return { type: 'InstigatorSuccess' };
}

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'InstigatorFailure', reason };
};
