import { Constructor } from '../../../utils';
import { DefundingState } from '../../defunding';
export type ConcludingState = NonTerminalState | PreTerminalState | TerminalState;
export type ConcludingStateType = ConcludingState['type'];
import { ProtocolState } from '../..';

export type NonTerminalState =
  | ApproveConcluding
  | DecideDefund
  | WaitForDefund
  | AcknowledgeFailure
  | AcknowledgeSuccess;

export type PreTerminalState = AcknowledgeSuccess | AcknowledgeFailure;

export type TerminalState = Success | Failure;

export type FailureReason = 'NotYourTurn' | 'ChannelDoesntExist' | 'DefundFailed';

export interface AcknowledgeSuccess {
  type: 'ResponderAcknowledgeSuccess';
  processId: string;
  channelId: string;
}
export interface AcknowledgeFailure {
  type: 'ResponderAcknowledgeFailure';
  reason: FailureReason;
  processId: string;
  channelId: string;
}
export interface ApproveConcluding {
  type: 'ResponderApproveConcluding';
  processId: string;
  channelId: string;
}

export interface DecideDefund {
  type: 'ResponderDecideDefund';
  processId: string;
  channelId: string;
}

export interface WaitForDefund {
  type: 'ResponderWaitForDefund';
  processId: string;
  channelId: string;
  defundingState: DefundingState;
}

export interface Failure {
  type: 'ResponderFailure';
  reason: FailureReason;
}

export interface Success {
  type: 'ResponderSuccess';
}

// -------
// Helpers
// -------

export function isTerminal(state: ConcludingState): state is Failure | Success {
  return state.type === 'ResponderFailure' || state.type === 'ResponderSuccess';
}

export function isSuccess(state: ConcludingState): state is Success {
  return state.type === 'ResponderSuccess';
}

export function isFailure(state: ConcludingState): state is Failure {
  return state.type === 'ResponderFailure';
}

export function isConcludingResponderState(state: ProtocolState): state is ConcludingState {
  return (
    state.type === 'ResponderAcknowledgeSuccess' ||
    state.type === 'ResponderAcknowledgeFailure' ||
    state.type === 'ResponderApproveConcluding' ||
    state.type === 'ResponderDecideDefund' ||
    state.type === 'ResponderWaitForDefund'
  );
}

// ------------
// Constructors
// ------------

export const approveConcluding: Constructor<ApproveConcluding> = p => {
  const { processId, channelId } = p;
  return { type: 'ResponderApproveConcluding', processId, channelId };
};

export const decideDefund: Constructor<DecideDefund> = p => {
  const { processId, channelId } = p;
  return { type: 'ResponderDecideDefund', processId, channelId };
};

export const acknowledgeSuccess: Constructor<AcknowledgeSuccess> = p => {
  const { processId, channelId } = p;
  return { type: 'ResponderAcknowledgeSuccess', processId, channelId };
};

export const acknowledgeFailure: Constructor<AcknowledgeFailure> = p => {
  const { processId, channelId, reason } = p;
  return { type: 'ResponderAcknowledgeFailure', processId, channelId, reason };
};

export const waitForDefund: Constructor<WaitForDefund> = p => {
  const { processId, channelId, defundingState } = p;
  return { type: 'ResponderWaitForDefund', processId, channelId, defundingState };
};

export function success(): Success {
  return { type: 'ResponderSuccess' };
}

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'ResponderFailure', reason };
};
