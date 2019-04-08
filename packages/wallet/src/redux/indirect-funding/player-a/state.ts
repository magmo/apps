import { Properties } from '../../utils';
import { IndirectFundingState } from '../state';

export const WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL_A';
export const WAIT_FOR_PRE_FUND_SETUP_1 = 'WAIT_FOR_PRE_FUND_SETUP_1';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING_A';
export const WAIT_FOR_POST_FUND_SETUP_1 = 'WAIT_FOR_POST_FUND_SETUP_1';
export const WAIT_FOR_LEDGER_UPDATE_1 = 'WAIT_FOR_LEDGER_UPDATE_1';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  channelId: string;
}

export interface WaitForPreFundSetup1 {
  type: typeof WAIT_FOR_PRE_FUND_SETUP_1;
  channelId: string;
  ledgerId: string;
}

export interface WaitForDirectFunding {
  type: typeof WAIT_FOR_DIRECT_FUNDING;
  channelId: string;
  ledgerId: string;
}
export interface WaitForPostFundSetup1 {
  type: typeof WAIT_FOR_POST_FUND_SETUP_1;
  channelId: string;
  ledgerId: string;
}
export interface WaitForLedgerUpdate1 {
  type: typeof WAIT_FOR_LEDGER_UPDATE_1;
  channelId: string;
  ledgerId: string;
}

export type PlayerAState =
  | WaitForApproval
  | WaitForPreFundSetup1
  | WaitForDirectFunding
  | WaitForPostFundSetup1
  | WaitForLedgerUpdate1;

export function waitForApproval(params: Properties<WaitForApproval>): WaitForApproval {
  const { channelId } = params;

  return { type: WAIT_FOR_APPROVAL, channelId };
}

export function waitForPreFundSetup1(
  params: Properties<WaitForPreFundSetup1>,
): WaitForPreFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_PRE_FUND_SETUP_1, channelId, ledgerId };
}

export function waitForDirectFunding(
  params: Properties<WaitForDirectFunding>,
): WaitForDirectFunding {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_DIRECT_FUNDING, channelId, ledgerId };
}

export function waitForPostFundSetup1(
  params: Properties<WaitForPostFundSetup1>,
): WaitForPostFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_POST_FUND_SETUP_1, channelId, ledgerId };
}

export function waitForLedgerUpdate1(
  params: Properties<WaitForLedgerUpdate1>,
): WaitForLedgerUpdate1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_LEDGER_UPDATE_1, channelId, ledgerId };
}

// -------
// Helpers
// -------

export function isPlayerAState(state: IndirectFundingState): state is PlayerAState {
  switch (state.type) {
    case WAIT_FOR_APPROVAL:
    case WAIT_FOR_LEDGER_UPDATE_1:
    case WAIT_FOR_DIRECT_FUNDING:
    case WAIT_FOR_POST_FUND_SETUP_1:
    case WAIT_FOR_PRE_FUND_SETUP_1:
      return true;
    default:
      return false;
  }
}
