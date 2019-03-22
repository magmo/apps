import {
  FirstCommitmentReceived,
  firstCommitmentReceived,
  SharedChannelState,
  baseChannelState,
  TypedChannelState,
} from '../../shared/state';

// stage
export const OPENING = 'OPENING';

// state type
export const WAIT_FOR_CHANNEL = 'WAIT_FOR_CHANNEL';
export const WAIT_FOR_PRE_FUND_SETUP = 'WAIT_FOR_PRE_FUND_SETUP';
export const METAMASK_LOAD_ERROR = 'METAMASK_LOAD_ERROR';

export interface WaitForChannel extends SharedChannelState, TypedChannelState {
  // In this state, the slot has been reserved for the channel, with
  // the address and private key stored in it.
  type: typeof WAIT_FOR_CHANNEL;
  stage: typeof OPENING;
}
export function waitForChannel<T extends SharedChannelState>(params: T): WaitForChannel {
  return {
    type: WAIT_FOR_CHANNEL,
    stage: OPENING,
    channelType: 'Application',
    ...baseChannelState(params),
  };
}

export interface WaitForPreFundSetup extends FirstCommitmentReceived, TypedChannelState {
  type: typeof WAIT_FOR_PRE_FUND_SETUP;
  stage: typeof OPENING;
}

export function waitForPreFundSetup<T extends FirstCommitmentReceived>(
  params: T,
): WaitForPreFundSetup {
  return {
    type: WAIT_FOR_PRE_FUND_SETUP,
    stage: OPENING,
    channelType: 'Application',
    ...firstCommitmentReceived(params),
  };
}

export type OpeningState = WaitForChannel | WaitForPreFundSetup;
