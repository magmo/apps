import {
  FirstCommitmentReceived,
  firstCommitmentReceived,
  SharedChannelState,
  baseChannelState,
} from '../../shared/state';

// stage
export const OPENING = 'OPENING';

// state type
export const SEND_INITIAL_PRE_FUND_SETUP = 'SEND_INITIAL_PRE_FUND_SETUP';
export const WAIT_FOR_PRE_FUND_SETUP = 'WAIT_FOR_PRE_FUND_SETUP';
export const WAIT_FOR_INITIAL_PRE_FUND_SETUP = 'WAIT_FOR_INITIAL_PRE_FUND_SETUP';

export interface SendInitialPreFundSetup
  extends LedgerChannelInitialized,
    SharedLedgerChannelState {
  type: typeof SEND_INITIAL_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export interface WaitForPreFundSetup extends FirstCommitmentReceived, SharedLedgerChannelState {
  type: typeof WAIT_FOR_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export interface WaitForInitialPreFundSetup extends SharedChannelState, SharedLedgerChannelState {
  type: typeof WAIT_FOR_INITIAL_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export function sendInitialPreFundSetup<
  T extends LedgerChannelInitialized & SharedLedgerChannelState
>(params: T): SendInitialPreFundSetup {
  return {
    type: SEND_INITIAL_PRE_FUND_SETUP,
    stage: OPENING,
    ...ledgerChannelInitialized(params),
  };
}

export function waitForPreFundSetup<T extends FirstCommitmentReceived & SharedLedgerChannelState>(
  params: T,
): WaitForPreFundSetup {
  const { appChannelId } = params;
  return {
    type: WAIT_FOR_PRE_FUND_SETUP,
    stage: OPENING,
    ...firstCommitmentReceived(params),
    appChannelId,
  };
}

export function waitForInitialPreFundSetup<T extends SharedChannelState & SharedLedgerChannelState>(
  params: T,
): WaitForInitialPreFundSetup {
  const { appChannelId } = params;
  return {
    type: WAIT_FOR_INITIAL_PRE_FUND_SETUP,
    stage: OPENING,
    ...baseChannelState(params),
    appChannelId,
  };
}

export type OpeningState =
  | SendInitialPreFundSetup
  | WaitForPreFundSetup
  | WaitForInitialPreFundSetup;

export interface LedgerChannelInitialized extends SharedChannelState, SharedLedgerChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  allocation: [string, string];
  funded: boolean;
}

export interface SharedLedgerChannelState {
  appChannelId: string;
}

export function ledgerChannelInitialized<
  T extends LedgerChannelInitialized & SharedLedgerChannelState
>(params: T): LedgerChannelInitialized {
  const {
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
    allocation,
    appChannelId,
  } = params;
  return {
    ...baseChannelState(params),
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
    allocation,
    appChannelId,
  };
}
