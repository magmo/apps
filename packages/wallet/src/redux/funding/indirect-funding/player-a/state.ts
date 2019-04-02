import { Properties } from '../../../utils';

export const WAIT_FOR_STRATEGY_RESPONSE = 'WAIT_FOR_STRATEGY_RESPONSE';
export const WAIT_FOR_PRE_FUND_SETUP_1 = 'WAIT_FOR_PRE_FUND_SETUP_1';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING';
export const WAIT_FOR_POST_FUND_SETUP_1 = 'WAIT_FOR_POST_FUND_SETUP_1';
export const WAI_FOR_LEDGER_UPDATE_1 = 'WAI_FOR_LEDGER_UPDATE_1';

interface BasePlayerAState {
  channelId: string;
  ledgerId: string;
}

export interface WaitForStrategyResponse extends BasePlayerAState {
  type: typeof WAIT_FOR_STRATEGY_RESPONSE;
}

export interface WaitForPreFundSetup1 extends BasePlayerAState {
  type: typeof WAIT_FOR_PRE_FUND_SETUP_1;
}

export interface WaitForDirectFunding extends BasePlayerAState {
  type: typeof WAIT_FOR_DIRECT_FUNDING;
}
export interface WaitForPostFundSetup1 extends BasePlayerAState {
  type: typeof WAIT_FOR_POST_FUND_SETUP_1;
}
export interface WaitForLedgerUpdate1 extends BasePlayerAState {
  type: typeof WAI_FOR_LEDGER_UPDATE_1;
}

export type PlayerAState =
  | WaitForStrategyResponse
  | WaitForPreFundSetup1
  | WaitForDirectFunding
  | WaitForPostFundSetup1
  | WaitForLedgerUpdate1;

export function waitForStrategyResponse(
  params: Properties<WaitForStrategyResponse>,
): WaitForStrategyResponse {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_STRATEGY_RESPONSE, channelId, ledgerId };
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
  return { type: WAI_FOR_LEDGER_UPDATE_1, channelId, ledgerId };
}
