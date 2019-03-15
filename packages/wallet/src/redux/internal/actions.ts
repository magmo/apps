export const DIRECT_FUNDING_REQUESTED = 'WALLET.INTERNAL.DIRECT_FUNDING_REQUESTED';
export const directFundingRequested = (
  channelId: string,
  safeToDepositAmount: string,
  totalFundingRequired: string,
  requiredDeposit: string,
) => ({
  type: DIRECT_FUNDING_REQUESTED as typeof DIRECT_FUNDING_REQUESTED,
  channelId,
  totalFundingRequired,
  safeToDepositAmount,
  requiredDeposit,
});
export type DirectFundingRequested = ReturnType<typeof directFundingRequested>;

export type Action = DirectFundingRequested;
