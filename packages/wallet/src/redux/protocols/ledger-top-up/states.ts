import { DirectFundingState } from '../direct-funding/states';
import { StateConstructor } from '../../utils';

export interface WaitForDirectFunding {
  type: 'LedgerTopUp.WaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  processId: string;
  directFundingState: DirectFundingState;
}

export interface WaitForLedgerUpdate {
  type: 'LedgerTopUp.WaitForLedgerUpdate';
  channelId: string;
  ledgerId: string;
  processId: string;
}

export interface WaitForLedgerReOrg {
  type: 'LedgerTopUp.WaitForLedgerReOrg';
  channelId: string;
  ledgerId: string;
  processId: string;
}
export interface Failure {
  type: 'LedgerTopUp.Failure';
  reason: string;
}

export interface Success {
  type: 'LedgerTopUp.Success';
}
export const waitForDirectFunding: StateConstructor<WaitForDirectFunding> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForDirectFunding',
  };
};

export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForLedgerUpdate',
  };
};

export const waitForLedgerReOrg: StateConstructor<WaitForLedgerReOrg> = p => {
  return {
    ...p,
    type: 'LedgerTopUp.WaitForLedgerReOrg',
  };
};
export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'LedgerTopUp.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'LedgerTopUp.Failure' };
};

export type LedgerTopUpState =
  | WaitForDirectFunding
  | WaitForLedgerReOrg
  | WaitForLedgerUpdate
  | Success
  | Failure;
