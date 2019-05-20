import { Properties as P } from '../../../utils';
import { ProtocolState } from '../..';
import { FundingStrategy } from '..';
import { NonTerminalIndirectFundingState } from '../../indirect-funding/state';

export type OngoingFundingState =
  | WaitForStrategyProposal
  | WaitForStrategyApproval
  | WaitForFunding
  | WaitForSuccessConfirmation;

export type TerminalFundingState = Success | Failure;
export type FundingState = OngoingFundingState | TerminalFundingState;

export const WAIT_FOR_STRATEGY_PROPOSAL = 'IndirectFunding.PlayerB.WaitForStrategyProposal';
export const WAIT_FOR_STRATEGY_APPROVAL = 'IndirectFunding.PlayerB.WaitForStrategyApproval';
export const WAIT_FOR_FUNDING = 'IndirectFunding.PlayerB.WaitForFunding';
export const WAIT_FOR_SUCCESS_CONFIRMATION = 'IndirectFunding.PlayerB.WaitForSuccessConfirmation';
export const FAILURE = 'IndirectFunding.PlayerB.Failure';
export const SUCCESS = 'IndirectFunding.PlayerB.Success';

interface BaseState {
  processId: string;
  opponentAddress: string;
}

export interface WaitForStrategyProposal extends BaseState {
  type: typeof WAIT_FOR_STRATEGY_PROPOSAL;
  targetChannelId: string;
}

export interface WaitForStrategyApproval extends BaseState {
  type: typeof WAIT_FOR_STRATEGY_APPROVAL;
  targetChannelId: string;
  strategy: FundingStrategy;
}

export interface WaitForFunding extends BaseState {
  type: typeof WAIT_FOR_FUNDING;
  fundingState: NonTerminalIndirectFundingState;
  targetChannelId: string;
}

export interface WaitForSuccessConfirmation extends BaseState {
  type: typeof WAIT_FOR_SUCCESS_CONFIRMATION;
  targetChannelId: string;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

// -------
// Helpers
// -------

export function isTerminal(state: FundingState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}
export function isFundingState(state: ProtocolState): state is FundingState {
  return (
    state.type === WAIT_FOR_FUNDING ||
    state.type === WAIT_FOR_STRATEGY_APPROVAL ||
    state.type === WAIT_FOR_STRATEGY_PROPOSAL ||
    state.type === WAIT_FOR_SUCCESS_CONFIRMATION ||
    state.type === SUCCESS ||
    state.type === FAILURE
  );
}

// ------------
// Constructors
// ------------

export function waitForStrategyProposal(p: P<WaitForStrategyProposal>): WaitForStrategyProposal {
  const { processId, opponentAddress, targetChannelId } = p;
  return { type: WAIT_FOR_STRATEGY_PROPOSAL, processId, opponentAddress, targetChannelId };
}

export function waitForStrategyApproval(p: P<WaitForStrategyApproval>): WaitForStrategyApproval {
  const { processId, opponentAddress, targetChannelId, strategy } = p;
  return {
    type: WAIT_FOR_STRATEGY_APPROVAL,
    processId,
    opponentAddress,
    targetChannelId,
    strategy,
  };
}

export function waitForFunding(p: P<WaitForFunding>): WaitForFunding {
  const { processId, opponentAddress, fundingState, targetChannelId } = p;
  return { type: WAIT_FOR_FUNDING, processId, opponentAddress, fundingState, targetChannelId };
}

export function waitForSuccessConfirmation(
  p: P<WaitForSuccessConfirmation>,
): WaitForSuccessConfirmation {
  const { processId, opponentAddress, targetChannelId } = p;
  return { type: WAIT_FOR_SUCCESS_CONFIRMATION, processId, opponentAddress, targetChannelId };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}
