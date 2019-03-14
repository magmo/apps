import {
  SharedFundingState,
  UNKNOWN_FUNDING_TYPE,
  BaseFundingState,
  SharedUnknownFundingState,
} from '../../states/channels/funding/shared';
import { DirectFundingState } from '../../states/channels/funding/directFunding';
import { OutboxState } from '../../sharedState';

export const WAIT_FOR_FUNDING_REQUEST = 'WAIT_FOR_FUNDING_REQUEST';

export interface WaitForFundingRequest extends SharedUnknownFundingState {
  type: typeof WAIT_FOR_FUNDING_REQUEST;
}

export function waitForFundingRequest<T extends BaseFundingState>(
  params: T,
): WaitForFundingRequest {
  const { requestedTotalFunds, requestedYourContribution, channelId } = params;
  return {
    type: WAIT_FOR_FUNDING_REQUEST,
    fundingType: UNKNOWN_FUNDING_TYPE,
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
  };
}

export * from '../../states/channels/funding/directFunding';
export type FundingState = WaitForFundingRequest | DirectFundingState;
export { SharedFundingState, UNKNOWN_FUNDING_TYPE };

export interface DirectFundingStateWithSideEffects {
  fundingState: WaitForFundingRequest | DirectFundingState;
  outboxState?: OutboxState;
}
