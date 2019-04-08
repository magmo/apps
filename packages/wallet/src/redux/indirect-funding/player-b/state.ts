import { Properties } from '../../utils';

export const WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL_B';
export const WAIT_FOR_PRE_FUND_SETUP_0 = 'WAIT_FOR_PRE_FUND_SETUP_0';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING_B';
export const WAIT_FOR_POST_FUND_SETUP_0 = 'WAIT_FOR_POST_FUND_SETUP_0';
export const WAIT_FOR_LEDGER_UPDATE_0 = 'WAIT_FOR_LEDGER_UPDATE_0';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  channelId: string;
}

export interface WaitForPreFundSetup0 {
  type: typeof WAIT_FOR_PRE_FUND_SETUP_0;
  channelId: string;
}

export interface WaitForDirectFunding {
  type: typeof WAIT_FOR_DIRECT_FUNDING;
  channelId: string;
  ledgerId: string;
}
export interface WaitForPostFundSetup0 {
  type: typeof WAIT_FOR_POST_FUND_SETUP_0;
  channelId: string;
  ledgerId: string;
}
export interface WaitForLedgerUpdate0 {
  type: typeof WAIT_FOR_LEDGER_UPDATE_0;
  channelId: string;
  ledgerId: string;
}

export type PlayerBState =
  | WaitForApproval
  | WaitForPreFundSetup0
  | WaitForDirectFunding
  | WaitForPostFundSetup0
  | WaitForLedgerUpdate0;

export function waitForApproval(params: Properties<WaitForApproval>): WaitForApproval {
  const { channelId } = params;
  return { type: WAIT_FOR_APPROVAL, channelId };
}

export function waitForPreFundSetup0(
  params: Properties<WaitForPreFundSetup0>,
): WaitForPreFundSetup0 {
  const { channelId } = params;
  return { type: WAIT_FOR_PRE_FUND_SETUP_0, channelId };
}

export function waitForDirectFunding(
  params: Properties<WaitForDirectFunding>,
): WaitForDirectFunding {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_DIRECT_FUNDING, channelId, ledgerId };
}

export function waitForPostFundSetup0(
  params: Properties<WaitForPostFundSetup0>,
): WaitForPostFundSetup0 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_POST_FUND_SETUP_0, channelId, ledgerId };
}

export function waitForLedgerUpdate0(
  params: Properties<WaitForLedgerUpdate0>,
): WaitForLedgerUpdate0 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_LEDGER_UPDATE_0, channelId, ledgerId };
}
