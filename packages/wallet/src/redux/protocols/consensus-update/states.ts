import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';

export type NonTerminalConsensusUpdateState = NotSafeToSend | CommitmentSent;
export type ConsensusUpdateState = NonTerminalConsensusUpdateState | Failure | Success;
export type ConsensusUpdateStateType = ConsensusUpdateState['type'];

interface Base {
  proposedAllocation: string[];
  proposedDestination: string[];
  channelId: string;
  processId: string;
}

export interface NotSafeToSend extends Base {
  type: 'ConsensusUpdate.NotSafeToSend';
  clearedToSend: boolean;
}

export interface CommitmentSent extends Base {
  type: 'ConsensusUpdate.CommitmentSent';
}

export interface Failure {
  type: 'ConsensusUpdate.Failure';
  reason: string;
}

export interface Success {
  type: 'ConsensusUpdate.Success';
}

// -------
// Constructors
// -------

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'ConsensusUpdate.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'ConsensusUpdate.Failure' };
};

export const notSafeToSend: StateConstructor<NotSafeToSend> = p => {
  return { ...p, type: 'ConsensusUpdate.NotSafeToSend' };
};

export const commitmentSent: StateConstructor<CommitmentSent> = p => {
  return { ...p, type: 'ConsensusUpdate.CommitmentSent' };
};

export function isConsensusUpdateState(state: ProtocolState): state is ConsensusUpdateState {
  return (
    state.type === 'ConsensusUpdate.NotSafeToSend' ||
    state.type === 'ConsensusUpdate.CommitmentSent' ||
    isTerminal(state)
  );
}

export function isTerminal(state: ProtocolState): state is Failure | Success {
  return state.type === 'ConsensusUpdate.Failure' || state.type === 'ConsensusUpdate.Success';
}
