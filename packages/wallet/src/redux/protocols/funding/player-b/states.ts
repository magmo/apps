import { ProtocolState } from '../..';
import { FundingStrategy } from '..';
import { NonTerminalIndirectFundingState } from '../../indirect-funding/states';
import { Constructor } from '../../../utils';

// -------
// States
// -------
interface BaseState {
  processId: string;
  opponentAddress: string;
}

export interface WaitForStrategyProposal extends BaseState {
  type: 'Funding.PlayerB.WaitForStrategyProposal';
  targetChannelId: string;
}

export interface WaitForStrategyApproval extends BaseState {
  type: 'Funding.PlayerB.WaitForStrategyApproval';
  targetChannelId: string;
  strategy: FundingStrategy;
}

export interface WaitForFunding extends BaseState {
  type: 'Funding.PlayerB.WaitForFunding';
  fundingState: NonTerminalIndirectFundingState;
  targetChannelId: string;
}

export interface WaitForSuccessConfirmation extends BaseState {
  type: 'Funding.PlayerB.WaitForSuccessConfirmation';
  targetChannelId: string;
}

export interface Failure {
  type: 'Funding.PlayerB.Failure';
  reason: string;
}

export interface Success {
  type: 'Funding.PlayerB.Success';
}

// ------------
// Constructors
// ------------

export const waitForStrategyProposal: Constructor<WaitForStrategyProposal> = p => {
  const { processId, opponentAddress, targetChannelId } = p;
  return {
    type: 'Funding.PlayerB.WaitForStrategyProposal',
    processId,
    opponentAddress,
    targetChannelId,
  };
};

export const waitForStrategyApproval: Constructor<WaitForStrategyApproval> = p => {
  const { processId, opponentAddress, targetChannelId, strategy } = p;
  return {
    type: 'Funding.PlayerB.WaitForStrategyApproval',
    processId,
    opponentAddress,
    targetChannelId,
    strategy,
  };
};

export const waitForFunding: Constructor<WaitForFunding> = p => {
  const { processId, opponentAddress, fundingState, targetChannelId } = p;
  return {
    type: 'Funding.PlayerB.WaitForFunding',
    processId,
    opponentAddress,
    fundingState,
    targetChannelId,
  };
};

export const waitForSuccessConfirmation: Constructor<WaitForSuccessConfirmation> = p => {
  const { processId, opponentAddress, targetChannelId } = p;
  return {
    type: 'Funding.PlayerB.WaitForSuccessConfirmation',
    processId,
    opponentAddress,
    targetChannelId,
  };
};

export const success: Constructor<Success> = p => {
  return { type: 'Funding.PlayerB.Success' };
};

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'Funding.PlayerB.Failure', reason };
};

// -------
// Unions and Guards
// -------

export type OngoingFundingState =
  | WaitForStrategyProposal
  | WaitForStrategyApproval
  | WaitForFunding
  | WaitForSuccessConfirmation;

export type TerminalFundingState = Success | Failure;
export type FundingState = OngoingFundingState | TerminalFundingState;

export function isTerminal(state: FundingState): state is Failure | Success {
  return state.type === 'Funding.PlayerB.Failure' || state.type === 'Funding.PlayerB.Success';
}
export function isFundingState(state: ProtocolState): state is FundingState {
  return (
    state.type === 'Funding.PlayerB.WaitForFunding' ||
    state.type === 'Funding.PlayerB.WaitForStrategyApproval' ||
    state.type === 'Funding.PlayerB.WaitForStrategyProposal' ||
    state.type === 'Funding.PlayerB.WaitForSuccessConfirmation' ||
    state.type === 'Funding.PlayerB.Success' ||
    state.type === 'Funding.PlayerB.Failure'
  );
}
