import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';

export type ConsensusUpdateState = CommitmentSent | Failure | Success;
export type ConsensusUpdateStateType = ConsensusUpdateState['type'];

export interface CommitmentSent {
  type: 'ConsensusUpdate.CommitmentSent';
  proposedAllocation: string[];
  proposedDestination: string[];
  channelId: string;
  processId: string;
  clearedToSend: boolean;
  updateSent: boolean;
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

export const commitmentSent: StateConstructor<CommitmentSent> = p => {
  return { ...p, type: 'ConsensusUpdate.CommitmentSent' };
};

export function isConsensusUpdateState(state: ProtocolState): state is ConsensusUpdateState {
  return state.type === 'ConsensusUpdate.CommitmentSent' || isTerminal(state);
}

export function isTerminal(state: ProtocolState): state is Failure | Success {
  return state.type === 'ConsensusUpdate.Failure' || state.type === 'ConsensusUpdate.Success';
}
