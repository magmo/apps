import { SharedFundingState, SharedUnknownFundingState } from './shared';
import { DirectFundingState } from './directFunding';
import { OutboxState } from '../../shared';

export const WAIT_FOR_FUNDING_REQUEST = 'WAIT_FOR_FUNDING_REQUEST';
export const UNKNOWN_FUNDING_TYPE = 'FUNDING_TYPE.UNKNOWN';

export interface WaitForFundingRequest {
  type: typeof WAIT_FOR_FUNDING_REQUEST;
  fundingType: typeof UNKNOWN_FUNDING_TYPE;
  requestedTotalFunds: string;
  requestedYourContribution: string;
}

export function waitForFundingRequest<T extends SharedUnknownFundingState>(
  params: T,
): WaitForFundingRequest {
  const { requestedTotalFunds, requestedYourContribution } = params;
  return {
    type: WAIT_FOR_FUNDING_REQUEST,
    fundingType: UNKNOWN_FUNDING_TYPE,
    requestedTotalFunds,
    requestedYourContribution,
  };
}

export * from './directFunding';
export type FundingState = WaitForFundingRequest | DirectFundingState;
export { SharedFundingState };

export interface DirectFundingStateWithSideEffects {
  fundingState: WaitForFundingRequest | DirectFundingState;
  outboxState?: OutboxState;
}
