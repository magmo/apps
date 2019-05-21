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

export interface WaitForStrategyChoice extends BaseState {
  type: 'Funding.PlayerA.WaitForStrategyChoice';
  targetChannelId: string;
}

export interface WaitForStrategyResponse extends BaseState {
  type: 'Funding.PlayerA.WaitForStrategyResponse';
  targetChannelId: string;
  strategy: FundingStrategy;
}

export interface WaitForFunding extends BaseState {
  type: 'Funding.PlayerA.WaitForFunding';
  targetChannelId: string;
  // TODO: Currently we are limited to indirect funding
  // In the future this could support other funding states
  fundingState: NonTerminalIndirectFundingState;
}

export interface WaitForSuccessConfirmation extends BaseState {
  type: 'Funding.PlayerA.WaitForSuccessConfirmation';
  targetChannelId: string;
}

export interface Failure {
  type: 'Funding.PlayerA.Failure';
  reason: string;
}

export interface Success {
  type: 'Funding.PlayerA.Success';
}

// ------------
// Constructors
// ------------

export const waitForStrategyChoice: Constructor<WaitForStrategyChoice> = p => {
  const { processId, opponentAddress, targetChannelId } = p;
  return {
    type: 'Funding.PlayerA.WaitForStrategyChoice',
    processId,
    targetChannelId,
    opponentAddress,
  };
};

export const waitForStrategyResponse: Constructor<WaitForStrategyResponse> = p => {
  const { processId, opponentAddress, targetChannelId, strategy } = p;
  return {
    type: 'Funding.PlayerA.WaitForStrategyResponse',
    processId,
    opponentAddress,
    targetChannelId,
    strategy,
  };
};

export const waitForFunding: Constructor<WaitForFunding> = p => {
  const { processId, opponentAddress, fundingState, targetChannelId } = p;
  return {
    type: 'Funding.PlayerA.WaitForFunding',
    processId,
    opponentAddress,
    fundingState,
    targetChannelId,
  };
};

export const waitForSuccessConfirmation: Constructor<WaitForSuccessConfirmation> = p => {
  const { processId, opponentAddress, targetChannelId } = p;
  return {
    type: 'Funding.PlayerA.WaitForSuccessConfirmation',
    processId,
    opponentAddress,
    targetChannelId,
  };
};

export const success: Constructor<Success> = p => {
  return { type: 'Funding.PlayerA.Success' };
};

export const failure: Constructor<Failure> = p => {
  const { reason } = p;
  return { type: 'Funding.PlayerA.Failure', reason };
};

// -------
// Unions and Guards
// -------

export type OngoingFundingState =
  | WaitForStrategyChoice
  | WaitForStrategyResponse
  | WaitForFunding
  | WaitForSuccessConfirmation;

export type TerminalFundingState = Success | Failure;
export type FundingState = OngoingFundingState | TerminalFundingState;

export function isFundingState(state: ProtocolState): state is FundingState {
  return (
    state.type === 'Funding.PlayerA.WaitForFunding' ||
    state.type === 'Funding.PlayerA.WaitForStrategyChoice' ||
    state.type === 'Funding.PlayerA.WaitForStrategyResponse' ||
    state.type === 'Funding.PlayerA.WaitForSuccessConfirmation' ||
    state.type === 'Funding.PlayerA.Success' ||
    state.type === 'Funding.PlayerA.Failure'
  );
}

export function isTerminal(state: FundingState): state is TerminalFundingState {
  return state.type === 'Funding.PlayerA.Failure' || state.type === 'Funding.PlayerA.Success';
}
