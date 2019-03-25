import { ChannelOpen, channelOpen } from '../../shared/state';

// stage
export const FUNDING = 'FUNDING';
export const WAIT_FOR_FUNDING_APPROVAL = 'CHANNEL.WAIT_FOR_FUNDING_APPROVAL';

export interface WaitForFundingApproval extends ChannelOpen {
  type: typeof WAIT_FOR_FUNDING_APPROVAL;
  stage: typeof FUNDING;
}
export function waitForFundingApproval<T extends ChannelOpen>(params: T): WaitForFundingApproval {
  return {
    type: WAIT_FOR_FUNDING_APPROVAL,
    stage: FUNDING,
    ...channelOpen(params),
  };
}

export type FundingState = WaitForFundingApproval;
