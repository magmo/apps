import {
  FirstCommitmentReceived,
  firstCommitmentReceived,
  SharedChannelState,
  baseChannelState,
} from '../../shared/state';

// stage
export const OPENING = 'OPENING';

// state type
export const SEND_INITIAL_PRE_FUND_SETUP = 'A_WAIT_FOR_CHANNEL';
export const WAIT_FOR_PRE_FUND_SETUP = 'A_WAIT_FOR_PRE_FUND_SETUP';
export const WAIT_FOR_INITIAL_PRE_FUND_SETUP = 'B_WAIT_FOR_PRE_FUND_SETUP';

export interface SendInitialPreFundSetup extends LedgerChannelInitialized {
  type: typeof SEND_INITIAL_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export interface WaitForPreFundSetup extends FirstCommitmentReceived {
  type: typeof WAIT_FOR_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export interface WaitForInitialPreFundSetup extends SharedChannelState {
  type: typeof WAIT_FOR_INITIAL_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export function sendInitialPreFundSetup<T extends LedgerChannelInitialized>(
  params: T,
): SendInitialPreFundSetup {
  return {
    type: SEND_INITIAL_PRE_FUND_SETUP,
    stage: OPENING,
    ...ledgerChannelInitialized(params),
  };
}

export function waitForPreFundSetup<T extends FirstCommitmentReceived>(
  params: T,
): WaitForPreFundSetup {
  return {
    type: WAIT_FOR_PRE_FUND_SETUP,
    stage: OPENING,
    ...firstCommitmentReceived(params),
  };
}

export function waitForInitialPreFundSetup<T extends SharedChannelState>(
  params: T,
): WaitForInitialPreFundSetup {
  return {
    type: WAIT_FOR_INITIAL_PRE_FUND_SETUP,
    stage: OPENING,
    ...baseChannelState(params),
  };
}

export type OpeningState =
  | SendInitialPreFundSetup
  | WaitForPreFundSetup
  | WaitForInitialPreFundSetup;

export interface LedgerChannelInitialized extends SharedChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  allocation: [string, string];
  funded: boolean;
}

export function ledgerChannelInitialized<T extends LedgerChannelInitialized>(
  params: T,
): LedgerChannelInitialized {
  const {
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
    allocation,
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
  };
}
