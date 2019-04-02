import { Properties } from '../../../utils';

export const WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL';
export const WAIT_FOR_INDIRECT_FUNDING_STRATEGY_RESPONSE =
  'WAIT_FOR_INDIRECT_FUNDING_STRATEGY_RESPONSE';
export const WAIT_FOR_DIRECT_FUNDING_STRATEGY_RESPONSE =
  'WAIT_FOR_DIRECT_FUNDING_STRATEGY_RESPONSE';
export const WAIT_FOR_PRE_FUND_SETUP_1 = 'WAIT_FOR_PRE_FUND_SETUP_1';
export const WAIT_FOR_DIRECT_FUNDING = 'WAIT_FOR_DIRECT_FUNDING';
export const WAIT_FOR_POST_FUND_SETUP_1 = 'WAIT_FOR_POST_FUND_SETUP_1';
export const WAI_FOR_LEDGER_UPDATE_1 = 'WAI_FOR_LEDGER_UPDATE_1';

interface BasePlayerAState {
  channelId: string;
  ledgerId: string;
}

export interface WaitForApproval extends BasePlayerAState {
  type: typeof WAIT_FOR_APPROVAL;
}

export interface WaitForIndirectFundingStrategyResponse extends BasePlayerAState {
  type: typeof WAIT_FOR_INDIRECT_FUNDING_STRATEGY_RESPONSE;
}

export interface WaitForDirectFundingStrategyResponse extends BasePlayerAState {
  type: typeof WAIT_FOR_DIRECT_FUNDING_STRATEGY_RESPONSE;
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
  | WaitForApproval
  | WaitForDirectFundingStrategyResponse
  | WaitForIndirectFundingStrategyResponse
  | WaitForPreFundSetup1
  | WaitForDirectFunding
  | WaitForPostFundSetup1
  | WaitForLedgerUpdate1;

export function waitForApproval(params: Properties<WaitForApproval>): WaitForApproval {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_APPROVAL, channelId, ledgerId };
}
export function waitForIndirectFundingStrategyResponse(
  params: Properties<WaitForIndirectFundingStrategyResponse>,
): WaitForIndirectFundingStrategyResponse {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_INDIRECT_FUNDING_STRATEGY_RESPONSE, channelId, ledgerId };
}

export function waitForDirectFundingStrategyResponse(
  params: Properties<WaitForDirectFundingStrategyResponse>,
): WaitForDirectFundingStrategyResponse {
  const { channelId, ledgerId } = params;
  return { type: WAIT_FOR_DIRECT_FUNDING_STRATEGY_RESPONSE, channelId, ledgerId };
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
