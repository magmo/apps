import { DirectFundingState } from '../../direct-funding/states';
import { StateConstructor } from '../../../utils';
import { ProtocolState } from '../..';
import { ConsensusUpdateState } from '../../consensus-update';
import { AdvanceChannelState } from '../../advance-channel';

// -------
// States
// -------

export interface AWaitForPreFundSetup1 {
  type: 'NewLedgerFunding.AWaitForPreFundSetup1';
  channelId: string;
  ledgerId: string;
  processId: string;
}

export interface AWaitForDirectFunding {
  type: 'NewLedgerFunding.AWaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  processId: string;
  directFundingState: DirectFundingState;
  postFundSetupState: AdvanceChannelState;
}
export interface AWaitForPostFundSetup1 {
  type: 'NewLedgerFunding.AWaitForPostFundSetup1';
  channelId: string;
  ledgerId: string;
  processId: string;
  postFundSetupState: AdvanceChannelState;
  consensusUpdateState: ConsensusUpdateState;
}
export interface AWaitForLedgerUpdate1 {
  type: 'NewLedgerFunding.AWaitForLedgerUpdate1';
  channelId: string;
  ledgerId: string;
  processId: string;
  consensusUpdateState: ConsensusUpdateState;
}

// ------------
// Constructors
// ------------

export const aWaitForPreFundSetup1: StateConstructor<AWaitForPreFundSetup1> = p => {
  return { ...p, type: 'NewLedgerFunding.AWaitForPreFundSetup1' };
};

export const aWaitForDirectFunding: StateConstructor<AWaitForDirectFunding> = p => {
  return {
    ...p,
    type: 'NewLedgerFunding.AWaitForDirectFunding',
  };
};

export const aWaitForPostFundSetup1: StateConstructor<AWaitForPostFundSetup1> = p => {
  return { ...p, type: 'NewLedgerFunding.AWaitForPostFundSetup1' };
};

export const aWaitForLedgerUpdate1: StateConstructor<AWaitForLedgerUpdate1> = p => {
  return { ...p, type: 'NewLedgerFunding.AWaitForLedgerUpdate1' };
};

// -------
// Unions and Guards
// -------

export type PlayerAState =
  | AWaitForPreFundSetup1
  | AWaitForDirectFunding
  | AWaitForPostFundSetup1
  | AWaitForLedgerUpdate1;

export function isPlayerAState(state: ProtocolState): state is PlayerAState {
  return (
    state.type === 'NewLedgerFunding.AWaitForPreFundSetup1' ||
    state.type === 'NewLedgerFunding.AWaitForDirectFunding' ||
    state.type === 'NewLedgerFunding.AWaitForPostFundSetup1' ||
    state.type === 'NewLedgerFunding.AWaitForLedgerUpdate1'
  );
}
