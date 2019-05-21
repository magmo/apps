import { StateConstructor } from '../../../utils';
import { DefundingState } from '../../defunding';
export type InstigatorConcludingState =
  | InstigatorNonTerminalState
  | InstigatorPreTerminalState
  | TerminalState;
export type InstigatorConcludingStateType = InstigatorConcludingState['type'];
import { ProtocolState } from '../..';
import { FailureReason, TerminalState } from '../states';

// -------
// States
// -------
export interface AcknowledgeSuccess {
  type: 'ConcludingInstigator.AcknowledgeSuccess';
  processId: string;
  channelId: string;
}
export interface AcknowledgeFailure {
  type: 'ConcludingInstigator.AcknowledgeFailure';
  reason: FailureReason;
  processId: string;
  channelId: string;
}
export interface ApproveConcluding {
  type: 'ConcludingInstigator.ApproveConcluding';
  processId: string;
  channelId: string;
}

export interface WaitForOpponentConclude {
  type: 'ConcludingInstigator.WaitForOpponentConclude';
  processId: string;
  channelId: string;
}

export interface AcknowledgeConcludeReceived {
  type: 'ConcludingInstigator.AcknowledgeConcludeReceived';
  processId: string;
  channelId: string;
}

export interface WaitForDefund {
  type: 'ConcludingInstigator.WaitForDefund';
  processId: string;
  channelId: string;
  defundingState: DefundingState;
}

export function isConcludingInstigatorState(
  state: ProtocolState,
): state is InstigatorConcludingState {
  return (
    state.type === 'ConcludingInstigator.AcknowledgeSuccess' ||
    state.type === 'ConcludingInstigator.AcknowledgeFailure' ||
    state.type === 'ConcludingInstigator.ApproveConcluding' ||
    state.type === 'ConcludingInstigator.WaitForOpponentConclude' ||
    state.type === 'ConcludingInstigator.AcknowledgeConcludeReceived' ||
    state.type === 'ConcludingInstigator.WaitForDefund'
  );
}

// ------------
// Constructors
// ------------

export const instigatorApproveConcluding: StateConstructor<ApproveConcluding> = p => {
  const { processId, channelId } = p;
  return { type: 'ConcludingInstigator.ApproveConcluding', processId, channelId };
};

export const instigatorWaitForOpponentConclude: StateConstructor<WaitForOpponentConclude> = p => {
  const { processId, channelId } = p;
  return { type: 'ConcludingInstigator.WaitForOpponentConclude', processId, channelId };
};

export const instigatorAcknowledgeConcludeReceived: StateConstructor<
  AcknowledgeConcludeReceived
> = p => {
  const { processId, channelId } = p;
  return { type: 'ConcludingInstigator.AcknowledgeConcludeReceived', processId, channelId };
};

export const instigatorAcknowledgeSuccess: StateConstructor<AcknowledgeSuccess> = p => {
  const { processId, channelId } = p;
  return { type: 'ConcludingInstigator.AcknowledgeSuccess', processId, channelId };
};

export const instigatorAcknowledgeFailure: StateConstructor<AcknowledgeFailure> = p => {
  const { processId, channelId, reason } = p;
  return { type: 'ConcludingInstigator.AcknowledgeFailure', processId, channelId, reason };
};

export const instigatorWaitForDefund: StateConstructor<WaitForDefund> = p => {
  const { processId, channelId, defundingState } = p;
  return { type: 'ConcludingInstigator.WaitForDefund', processId, channelId, defundingState };
};

// -------
// Unions and Guards
// -------
export type InstigatorNonTerminalState =
  | ApproveConcluding
  | WaitForOpponentConclude
  | AcknowledgeConcludeReceived
  | AcknowledgeFailure
  | AcknowledgeSuccess
  | WaitForDefund;

export type InstigatorPreTerminalState = AcknowledgeSuccess | AcknowledgeFailure;
