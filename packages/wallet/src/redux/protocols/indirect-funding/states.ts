import { NewLedgerFundingState } from '../new-ledger-funding/states';
import { ExistingLedgerFundingState } from '../existing-ledger-funding';
import { StateConstructor } from '../../utils';

export interface WaitForNewLedgerFunding {
  type: 'IndirectFunding.WaitForNewLedgerFunding';
  processId: string;
  newLedgerFundingState: NewLedgerFundingState;
  channelId: string;
}

export interface WaitForExistingLedgerFunding {
  type: 'IndirectFunding.WaitForExistingLedgerFunding';
  processId: string;
  existingLedgerFundingState: ExistingLedgerFundingState;
  channelId: string;
  ledgerId: string;
}

export interface Failure {
  type: 'IndirectFunding.Failure';
  reason: string;
}

export interface Success {
  type: 'IndirectFunding.Success';
}

export const waitForNewLedgerFunding: StateConstructor<WaitForNewLedgerFunding> = p => {
  return { ...p, type: 'IndirectFunding.WaitForNewLedgerFunding' };
};
export const waitForExistingLedgerFunding: StateConstructor<WaitForExistingLedgerFunding> = p => {
  return { ...p, type: 'IndirectFunding.WaitForExistingLedgerFunding' };
};

export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'IndirectFunding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'IndirectFunding.Failure' };
};

export type IndirectFundingState =
  | WaitForExistingLedgerFunding
  | WaitForNewLedgerFunding
  | Success
  | Failure;
