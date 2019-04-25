import { Properties as P } from '../../../utils';
import { DirectFundingState } from '../../direct-funding/state';
import { IndirectFundingState } from '../state';

export type PlayerBState = TerminalState | NonTerminalState;

export type NonTerminalState =
  | BWaitForPreFundSetup0
  | BWaitForDirectFunding
  | BWaitForLedgerUpdate0
  | BWaitForPostFundSetup0;

export type TerminalState = Success | Failure;

export interface BWaitForPreFundSetup0 {
  type: 'BWaitForPreFundSetup0';
  channelId: string;
}

export interface BWaitForDirectFunding {
  type: 'BWaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  directFundingState: DirectFundingState;
}
export interface BWaitForLedgerUpdate0 {
  type: 'BWaitForLedgerUpdate0';
  channelId: string;
  ledgerId: string;
}
export interface BWaitForPostFundSetup0 {
  type: 'BWaitForPostFundSetup0';
  channelId: string;
  ledgerId: string;
}

export interface Success {
  type: 'Success';
}

export interface Failure {
  type: 'Failure';
}

// -------
// Helpers
// -------

export function isPlayerBState(state: IndirectFundingState): state is PlayerBState {
  return (
    state.type === 'BWaitForPreFundSetup0' ||
    state.type === 'BWaitForDirectFunding' ||
    state.type === 'BWaitForPostFundSetup0' ||
    state.type === 'BWaitForLedgerUpdate0' ||
    state.type === 'Success' ||
    state.type === 'Failure'
  );
}

// --------
// Creators
// --------

export function bWaitForPreFundSetup0(params: P<BWaitForPreFundSetup0>): BWaitForPreFundSetup0 {
  const { channelId } = params;
  return { type: 'BWaitForPreFundSetup0', channelId };
}

export function bWaitForDirectFunding(params: P<BWaitForDirectFunding>): BWaitForDirectFunding {
  const { channelId, ledgerId, directFundingState } = params;
  return {
    type: 'BWaitForDirectFunding',
    channelId,
    ledgerId,
    directFundingState,
  };
}

export function bWaitForPostFundSetup0(params: P<BWaitForPostFundSetup0>): BWaitForPostFundSetup0 {
  const { channelId, ledgerId } = params;
  return { type: 'BWaitForPostFundSetup0', channelId, ledgerId };
}

export function bWaitForLedgerUpdate0(params: P<BWaitForLedgerUpdate0>): BWaitForLedgerUpdate0 {
  const { channelId, ledgerId } = params;
  return { type: 'BWaitForLedgerUpdate0', channelId, ledgerId };
}

export function success(): Success {
  return { type: 'Success' };
}

export function failure(): Failure {
  return { type: 'Failure' };
}
