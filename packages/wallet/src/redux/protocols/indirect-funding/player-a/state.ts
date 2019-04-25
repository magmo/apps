import { Properties as P } from '../../../utils';
import { DirectFundingState } from '../../direct-funding/state';
import { IndirectFundingState } from '../state';

export type PlayerAState =
  | AWaitForPreFundSetup1
  | AWaitForDirectFunding
  | AWaitForPostFundSetup1
  | AWaitForLedgerUpdate1;

export interface AWaitForPreFundSetup1 {
  type: 'AWaitForPreFundSetup1';
  channelId: string;
  ledgerId: string;
}

export interface AWaitForDirectFunding {
  type: 'AWaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  directFundingState: DirectFundingState;
}
export interface AWaitForPostFundSetup1 {
  type: 'AWaitForPostFundSetup1';
  channelId: string;
  ledgerId: string;
}
export interface AWaitForLedgerUpdate1 {
  type: 'AWaitForLedgerUpdate1';
  channelId: string;
  ledgerId: string;
}

// -------
// Helpers
// -------

export function isPlayerAState(state: IndirectFundingState): state is PlayerAState {
  return (
    state.type === 'AWaitForPreFundSetup1' ||
    state.type === 'AWaitForDirectFunding' ||
    state.type === 'AWaitForPostFundSetup1' ||
    state.type === 'AWaitForLedgerUpdate1'
  );
}

// --------
// Creators
// --------

export function aWaitForPreFundSetup1(params: P<AWaitForPreFundSetup1>): AWaitForPreFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: 'AWaitForPreFundSetup1', channelId, ledgerId };
}

export function aWaitForDirectFunding(params: P<AWaitForDirectFunding>): AWaitForDirectFunding {
  const { channelId, ledgerId, directFundingState } = params;
  return {
    type: 'AWaitForDirectFunding',
    channelId,
    ledgerId,
    directFundingState,
  };
}

export function aWaitForPostFundSetup1(params: P<AWaitForPostFundSetup1>): AWaitForPostFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: 'AWaitForPostFundSetup1', channelId, ledgerId };
}

export function aWaitForLedgerUpdate1(params: P<AWaitForLedgerUpdate1>): AWaitForLedgerUpdate1 {
  const { channelId, ledgerId } = params;
  return { type: 'AWaitForLedgerUpdate1', channelId, ledgerId };
}
