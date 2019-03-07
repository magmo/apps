import {
  FirstCommitmentReceived,
  firstCommitmentReceived,
  BaseChannelState,
  baseChannelState,
} from './shared';

// stage
export const OPENING = 'OPENING';

// state type
export const WAIT_FOR_PRE_FUND_SETUP = 'WAIT_FOR_PRE_FUND_SETUP';
export const WAIT_FOR_CHANNEL = 'WAIT_FOR_CHANNEL';

export interface WaitForChannel extends BaseChannelState {
  type: typeof WAIT_FOR_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export function waitForChannel<T extends BaseChannelState>(params: T): WaitForChannel {
  return { type: WAIT_FOR_PRE_FUND_SETUP, stage: OPENING, ...baseChannelState(params) };
}

export interface WaitForPreFundSetup extends FirstCommitmentReceived {
  type: typeof WAIT_FOR_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export function waitForPreFundSetup<T extends FirstCommitmentReceived>(
  params: T,
): WaitForPreFundSetup {
  return { type: WAIT_FOR_PRE_FUND_SETUP, stage: OPENING, ...firstCommitmentReceived(params) };
}

export type OpeningState = WaitForPreFundSetup;
