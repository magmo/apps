import { StateConstructor } from '../../../utils';
export type ResponderConcludingState =
  | ResponderNonTerminalState
  | ResponderPreTerminalState
  | TerminalState;
export type ResponderConcludingStateType = ResponderConcludingState['type'];
import { ProtocolState } from '../..';
import { ConsensusUpdateState } from '../../consensus-update/states';
import { FailureReason, TerminalState } from '../states';

// -------
// States
// -------
export interface ResponderAcknowledgeSuccess {
  type: 'ConcludingResponder.AcknowledgeSuccess';
  processId: string;
  channelId: string;
}
export interface ResponderAcknowledgeFailure {
  type: 'ConcludingResponder.AcknowledgeFailure';
  reason: FailureReason;
  processId: string;
  channelId: string;
}
export interface ResponderApproveConcluding {
  type: 'ConcludingResponder.ApproveConcluding';
  processId: string;
  channelId: string;
}

export interface ResponderDecideDefund {
  type: 'ConcludingResponder.DecideDefund';
  processId: string;
  channelId: string;
  opponentHasSelected: boolean;
}

export interface ResponderWaitForOpponentSelection {
  type: 'ConcludingResponder.WaitForOpponentSelection';
  processId: string;
  channelId: string;
}
export interface ResponderWaitForLedgerUpdate {
  type: 'ConcludingResponder.WaitForLedgerUpdate';
  processId: string;
  channelId: string;
  consensusUpdateState: ConsensusUpdateState;
}

export function isConcludingResponderState(
  state: ProtocolState,
): state is ResponderConcludingState {
  return (
    state.type === 'ConcludingResponder.AcknowledgeSuccess' ||
    state.type === 'ConcludingResponder.AcknowledgeFailure' ||
    state.type === 'ConcludingResponder.ApproveConcluding' ||
    state.type === 'ConcludingResponder.DecideDefund' ||
    state.type === 'ConcludingResponder.WaitForLedgerUpdate' ||
    state.type === 'ConcludingResponder.WaitForOpponentSelection'
  );
}

// ------------
// Constructors
// ------------

export const approveConcluding: StateConstructor<ResponderApproveConcluding> = p => {
  return { ...p, type: 'ConcludingResponder.ApproveConcluding' };
};

export const decideDefund: StateConstructor<ResponderDecideDefund> = p => {
  return { ...p, type: 'ConcludingResponder.DecideDefund' };
};

export const acknowledgeSuccess: StateConstructor<ResponderAcknowledgeSuccess> = p => {
  return { ...p, type: 'ConcludingResponder.AcknowledgeSuccess' };
};

export const acknowledgeFailure: StateConstructor<ResponderAcknowledgeFailure> = p => {
  return { ...p, type: 'ConcludingResponder.AcknowledgeFailure' };
};

export const waitForLedgerUpdate: StateConstructor<ResponderWaitForLedgerUpdate> = p => {
  return { ...p, type: 'ConcludingResponder.WaitForLedgerUpdate' };
};
export const waitForOpponentSelection: StateConstructor<ResponderWaitForOpponentSelection> = p => {
  return { ...p, type: 'ConcludingResponder.WaitForOpponentSelection' };
};
// -------
// Unions and Guards
// -------

export type ResponderNonTerminalState =
  | ResponderApproveConcluding
  | ResponderDecideDefund
  | ResponderAcknowledgeFailure
  | ResponderAcknowledgeSuccess
  | ResponderWaitForLedgerUpdate
  | ResponderWaitForOpponentSelection;

export type ResponderPreTerminalState = ResponderAcknowledgeSuccess | ResponderAcknowledgeFailure;
