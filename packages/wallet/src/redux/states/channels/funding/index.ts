import { SharedFundingState } from './shared';
import { DirectFundingState, directFundingState } from './directFunding';

export const WAIT_FOR_FUNDING_REQUEST = 'WAIT_FOR_FUNDING_REQUEST';
export const UNKNOWN_FUNDING_TYPE = 'FUNDING_TYPE.UNKNOWN';

export interface WaitForFundingRequest {
  type: typeof WAIT_FOR_FUNDING_REQUEST;
  fundingType: typeof UNKNOWN_FUNDING_TYPE;
  requestedTotalFunds: string;
  requestedYourContribution: string;
}

export function waitForFundingRequest<T extends SharedFundingState>(
  params: T,
): WaitForFundingRequest {
  return {
    ...directFundingState(params),
    type: WAIT_FOR_FUNDING_REQUEST,
    fundingType: UNKNOWN_FUNDING_TYPE,
  };
}

export * from './directFunding';
export type FundingState = WaitForFundingRequest | DirectFundingState;
export { SharedFundingState };
