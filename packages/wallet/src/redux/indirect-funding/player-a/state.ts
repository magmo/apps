import { Properties } from '../../utils';
import { PlayerIndex } from '../../types';

export const WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL';
export const WAIT_FOR_PRE_FUND_SETUP_1 = 'WAIT_FOR_PRE_FUND_SETUP_1';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING';
export const WAIT_FOR_POST_FUND_SETUP_1 = 'WAIT_FOR_POST_FUND_SETUP_1';
export const WAIT_FOR_LEDGER_UPDATE_1 = 'WAIT_FOR_LEDGER_UPDATE_1';

export interface WaitForApproval {
  type: typeof WAIT_FOR_APPROVAL;
  channelId: string;
  player: PlayerIndex.A;
}

export interface WaitForPreFundSetup1 {
  type: typeof WAIT_FOR_PRE_FUND_SETUP_1;
  channelId: string;
  player: PlayerIndex.A;
  ledgerId: string;
}

export interface WaitForDirectFunding {
  type: typeof WAIT_FOR_DIRECT_FUNDING;
  channelId: string;
  player: PlayerIndex.A;
  ledgerId: string;
}
export interface WaitForPostFundSetup1 {
  type: typeof WAIT_FOR_POST_FUND_SETUP_1;
  channelId: string;
  player: PlayerIndex.A;
  ledgerId: string;
}
export interface WaitForLedgerUpdate1 {
  type: typeof WAIT_FOR_LEDGER_UPDATE_1;
  channelId: string;
  player: PlayerIndex.A;
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

  return { type: WAIT_FOR_APPROVAL, player: PlayerIndex.A, channelId };
}

export function waitForPreFundSetup1(
  params: Properties<WaitForPreFundSetup1>,
): WaitForPreFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_PRE_FUND_SETUP_1, player: PlayerIndex.A, channelId, ledgerId };
}

export function waitForDirectFunding(
  params: Properties<WaitForDirectFunding>,
): WaitForDirectFunding {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_DIRECT_FUNDING, player: PlayerIndex.A, channelId, ledgerId };
}

export function waitForPostFundSetup1(
  params: Properties<WaitForPostFundSetup1>,
): WaitForPostFundSetup1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_POST_FUND_SETUP_1, player: PlayerIndex.A, channelId, ledgerId };
}

export function waitForLedgerUpdate1(
  params: Properties<WaitForLedgerUpdate1>,
): WaitForLedgerUpdate1 {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_LEDGER_UPDATE_1, player: PlayerIndex.A, channelId, ledgerId };
}
