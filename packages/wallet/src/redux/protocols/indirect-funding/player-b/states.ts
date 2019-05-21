import { DirectFundingState } from '../../direct-funding/states';
import { NonTerminalIndirectFundingState } from '../states';
import { Constructor } from '../../../utils';

// -------
// States
// -------

export interface BWaitForPreFundSetup0 {
  type: 'IndirectFunding.BWaitForPreFundSetup0';
  channelId: string;
  processId: string;
}

export interface BWaitForDirectFunding {
  type: 'IndirectFunding.BWaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  directFundingState: DirectFundingState;
  processId: string;
}
export interface BWaitForLedgerUpdate0 {
  type: 'IndirectFunding.BWaitForLedgerUpdate0';
  channelId: string;
  ledgerId: string;
  processId: string;
}
export interface BWaitForPostFundSetup0 {
  type: 'IndirectFunding.BWaitForPostFundSetup0';
  channelId: string;
  ledgerId: string;
  processId: string;
}

// ------------
// Constructors
// ------------

export const bWaitForPreFundSetup0: Constructor<BWaitForPreFundSetup0> = p => {
  const { channelId, processId } = p;
  return { type: 'IndirectFunding.BWaitForPreFundSetup0', channelId, processId };
};

export const bWaitForDirectFunding: Constructor<BWaitForDirectFunding> = p => {
  const { channelId, ledgerId, directFundingState, processId } = p;
  return {
    type: 'IndirectFunding.BWaitForDirectFunding',
    channelId,
    ledgerId,
    directFundingState,
    processId,
  };
};

export const bWaitForPostFundSetup0: Constructor<BWaitForPostFundSetup0> = p => {
  const { channelId, ledgerId, processId } = p;
  return { type: 'IndirectFunding.BWaitForPostFundSetup0', channelId, ledgerId, processId };
};

export const bWaitForLedgerUpdate0: Constructor<BWaitForLedgerUpdate0> = p => {
  const { channelId, ledgerId, processId } = p;
  return { type: 'IndirectFunding.BWaitForLedgerUpdate0', channelId, ledgerId, processId };
};

// -------
// Unions and Guards
// -------

export type PlayerBState =
  | BWaitForPreFundSetup0
  | BWaitForDirectFunding
  | BWaitForLedgerUpdate0
  | BWaitForPostFundSetup0;

export function isPlayerBState(state: NonTerminalIndirectFundingState): state is PlayerBState {
  return (
    state.type === 'IndirectFunding.BWaitForPreFundSetup0' ||
    state.type === 'IndirectFunding.BWaitForDirectFunding' ||
    state.type === 'IndirectFunding.BWaitForPostFundSetup0' ||
    state.type === 'IndirectFunding.BWaitForLedgerUpdate0'
  );
}
