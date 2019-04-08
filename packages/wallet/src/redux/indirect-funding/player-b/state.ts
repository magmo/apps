import { Properties } from '../../utils';
import { PlayerIndex } from '../../types';

export const WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL_B';
export const WAIT_FOR_PRE_FUND_SETUP_0 = 'WAIT_FOR_PRE_FUND_SETUP_0';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING_B';
export const WAIT_FOR_POST_FUND_SETUP_0 = 'WAIT_FOR_POST_FUND_SETUP_0';
export const WAIT_FOR_LEDGER_UPDATE_0 = 'WAIT_FOR_LEDGER_UPDATE_0';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  channelId: string;
  player: PlayerIndex.B;
}

export interface WaitForPreFundSetup0 {
  type: typeof WAIT_FOR_PRE_FUND_SETUP_0;
  channelId: string;
  player: PlayerIndex.B;
}

export interface WaitForDirectFunding {
  type: typeof WAIT_FOR_DIRECT_FUNDING;
  channelId: string;
  player: PlayerIndex.B;
  ledgerId: string;
}
export interface WaitForPostFundSetup0 {
  type: typeof WAIT_FOR_POST_FUND_SETUP_0;
  channelId: string;
  player: PlayerIndex.B;
  ledgerId: string;
}
export interface WaitForLedgerUpdate0 {
  type: typeof WAIT_FOR_LEDGER_UPDATE_0;
  channelId: string;
  player: PlayerIndex.B;
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

  return { type: WAIT_FOR_APPROVAL, player: PlayerIndex.B, channelId };
}

export function waitForPreFundSetup0(
  params: Properties<WaitForPreFundSetup0>,
): WaitForPreFundSetup0 {
  const { channelId } = params;
  return { type: WAIT_FOR_PRE_FUND_SETUP_0, player: PlayerIndex.B, channelId };
}

export function waitForDirectFunding(
  params: Properties<WaitForDirectFunding>,
): WaitForDirectFunding {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_DIRECT_FUNDING, player: PlayerIndex.B, channelId, ledgerId };
}

export function waitForPostFundSetup0(
  params: Properties<WaitForPostFundSetup0>,
): WaitForPostFundSetup0 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_POST_FUND_SETUP_0, player: PlayerIndex.B, channelId, ledgerId };
}

export function waitForLedgerUpdate0(
  params: Properties<WaitForLedgerUpdate0>,
): WaitForLedgerUpdate0 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_LEDGER_UPDATE_0, player: PlayerIndex.B, channelId, ledgerId };
}
