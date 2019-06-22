import { ProtocolState } from '..';
import { StateConstructor, Properties } from '../../utils';
import { AdvanceChannelState } from '../advance-channel';

// -------
// States
// -------

interface Base {
  processId: string;
  targetChannelId: string;
}

export interface WaitForChannelPreparation extends Base {
  type: 'VirtualFunding.WaitForChannelPreparation';
  jointChannelState: AdvanceChannelState;
  guarantorChannelState: AdvanceChannelState;
}
export interface WaitForGuarantorFunding extends Base {
  type: 'VirtualFunding.WaitForGuarantorFunding';
  indirectFundingState: 'UpdateConsensusState<G>';
}
export interface WaitForApplicationFunding extends Base {
  type: 'VirtualFunding.WaitForApplicationFunding';
  indirectFundingState: 'UpdateConsensusState<J>';
}
export interface WaitForSuccessAcknowledgement extends Base {
  type: 'VirtualFunding.WaitForSuccessAcknowledgement';
}
export interface Success {
  type: 'VirtualFunding.Success';
}

export interface Failure {
  type: 'VirtualFunding.Failure';
}

// ------------
// Constructors
// ------------

export const waitForChannelPreparation: StateConstructor<WaitForChannelPreparation> = p => {
  return { type: 'VirtualFunding.WaitForChannelPreparation', ...p };
};
export const waitForGuarantorFunding: StateConstructor<WaitForGuarantorFunding> = p => {
  return { type: 'VirtualFunding.WaitForGuarantorFunding', ...p };
};
export const waitForApplicationFunding: StateConstructor<WaitForApplicationFunding> = p => {
  return { type: 'VirtualFunding.WaitForApplicationFunding', ...p };
};
export const waitForSuccessAcknowledgement: StateConstructor<WaitForSuccessAcknowledgement> = p => {
  return { type: 'VirtualFunding.WaitForSuccessAcknowledgement', ...p };
};

export const success: StateConstructor<Success> = _ => {
  return { type: 'VirtualFunding.Success' };
};

export const failure: StateConstructor<Failure> = _ => {
  return { type: 'VirtualFunding.Failure' };
};

// -------
// Unions and Guards
// -------

export type NonTerminalVirtualFundingState =
  | WaitForChannelPreparation
  | WaitForGuarantorFunding
  | WaitForApplicationFunding
  | WaitForSuccessAcknowledgement;

export type VirtualFundingState = NonTerminalVirtualFundingState | Success | Failure;
export type VirtualFundingStateType = VirtualFundingState['type'];

export function isVirtualFundingState(state: ProtocolState): state is VirtualFundingState {
  return (
    state.type === 'VirtualFunding.WaitForChannelPreparation' ||
    state.type === 'VirtualFunding.WaitForGuarantorFunding' ||
    state.type === 'VirtualFunding.WaitForApplicationFunding' ||
    state.type === 'VirtualFunding.WaitForSuccessAcknowledgement' ||
    state.type === 'VirtualFunding.Failure' ||
    state.type === 'VirtualFunding.Success'
  );
}

export function isTerminal(state: VirtualFundingState): state is Failure | Success {
  return state.type === 'VirtualFunding.Failure' || state.type === 'VirtualFunding.Success';
}
