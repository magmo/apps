import { DirectFundingState } from '../direct-funding/states';
import { StateConstructor } from '../../utils';

export interface WaitForDirectFundingForPlayerA {
  type: 'LedgerTopUp.WaitForDirectFundingForPlayerA';
  channelId: string;
  ledgerId: string;
  processId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
  directFundingState: DirectFundingState;
}

export interface WaitForDirectFundingForPlayerB {
  type: 'LedgerTopUp.WaitForDirectFundingForPlayerB';
  channelId: string;
  ledgerId: string;
  processId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
  directFundingState: DirectFundingState;
}

export interface WaitForLedgerUpdateForPlayerA {
  type: 'LedgerTopUp.WaitForLedgerUpdateForPlayerA';
  channelId: string;
  ledgerId: string;
  processId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
}
export interface WaitForLedgerUpdateForPlayerB {
  type: 'LedgerTopUp.WaitForLedgerUpdateForPlayerA';
  channelId: string;
  ledgerId: string;
  processId: string;
  proposedAllocation: string[];
  proposedDestination: string[];
}

export interface Failure {
  type: 'LedgerTopUp.Failure';
  reason: string;
}

export interface Success {
  type: 'LedgerTopUp.Success';
}
export const waitForDirectFundingForPlayerA: StateConstructor<
  WaitForDirectFundingForPlayerA
> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForDirectFundingForPlayerA',
  };
};
export const waitForDirectFundingForPlayerB: StateConstructor<
  WaitForDirectFundingForPlayerB
> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForDirectFundingForPlayerB',
  };
};

export const waitForLedgerUpdateForPlayerA: StateConstructor<WaitForLedgerUpdateForPlayerA> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForLedgerUpdateForPlayerA',
  };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'LedgerTopUp.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'LedgerTopUp.Failure' };
};

export type LedgerTopUpState =
  | WaitForLedgerUpdateForPlayerA
  | WaitForDirectFundingForPlayerB
  | WaitForDirectFundingForPlayerA
  | WaitForDirectFundingForPlayerB
  | Success
  | Failure;
