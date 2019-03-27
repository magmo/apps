import { ChannelOpen, channelOpen } from '../../shared/state';

// stage
export const FUNDING = 'FUNDING';
export const WAIT_FOR_FUNDING_AND_POST_FUND_SETUP = 'CHANNEL.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP';
export const WAIT_FOR_FUNDING_CONFIRMATION = 'WAIT_FOR_FUNDING_CONFIRMATION';
export const WAIT_FOR_POST_FUND_SETUP = 'WAIT_FOR_POST_FUND_SETUP';

export interface WaitForFundingConfirmation extends ChannelOpen {
  type: typeof WAIT_FOR_FUNDING_CONFIRMATION;
  stage: typeof FUNDING;
}

export function waitForFundingConfirmation<T extends ChannelOpen>(
         params: T,
       ): WaitForFundingConfirmation {
         return {
           type: WAIT_FOR_FUNDING_CONFIRMATION,
           stage: FUNDING,

           ...channelOpen(params),
         };
       }

export interface WaitForPostFundSetup extends ChannelOpen {
  type: typeof WAIT_FOR_POST_FUND_SETUP;
  stage: typeof FUNDING;
}

export function waitForPostFundSetup<T extends ChannelOpen>(params: T): WaitForPostFundSetup {
  return {
    type: WAIT_FOR_POST_FUND_SETUP,
    stage: FUNDING,

    ...channelOpen(params),
  };
}
export interface WaitForFundingAndPostFundSetup extends ChannelOpen {
  type: typeof WAIT_FOR_FUNDING_AND_POST_FUND_SETUP;
  stage: typeof FUNDING;
}

export function waitForFundingAndPostFundSetup<T extends ChannelOpen>(
  params: T,
): WaitForFundingAndPostFundSetup {
  return {
    type: WAIT_FOR_FUNDING_AND_POST_FUND_SETUP,
    stage: FUNDING,
    ...channelOpen(params),
  };
}

export type FundingState =
  | WaitForFundingAndPostFundSetup
  | WaitForFundingConfirmation
  | WaitForPostFundSetup;
