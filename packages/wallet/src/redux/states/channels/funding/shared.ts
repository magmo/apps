interface BaseFundingState {
  requestedTotalFunds: string;
  requestedYourContribution: string;
}

export const UNKNOWN_FUNDING = 'FUNDING_TYPE.UNKNOWN';
export interface SharedUnknownFundingState extends BaseFundingState {
  fundingType: typeof UNKNOWN_FUNDING;
}

export const DIRECT_FUNDING = 'FUNDING_TYPE.DIRECT';
export interface SharedDirectFundingState extends BaseFundingState {
  fundingType: typeof DIRECT_FUNDING;
}

export const INDIRECT_FUNDING = 'FUNDING_TYPE.INDIRECT';
export interface SharedIndirectFundingState extends BaseFundingState {
  fundingType: typeof INDIRECT_FUNDING;
}

export type SharedFundingState =
  | SharedUnknownFundingState
  | SharedDirectFundingState
  | SharedIndirectFundingState;
