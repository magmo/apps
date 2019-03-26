export const DIRECT_FUNDING_REQUESTED = 'WALLET.INTERNAL.DIRECT_FUNDING_REQUESTED';
export const directFundingRequested = (
  channelId: string,
  safeToDepositLevel: string,
  totalFundingRequired: string,
  requiredDeposit: string,
  ourIndex: number,
) => ({
  type: DIRECT_FUNDING_REQUESTED as typeof DIRECT_FUNDING_REQUESTED,
  channelId,
  totalFundingRequired,
  safeToDepositLevel,
  requiredDeposit,
  ourIndex,
});
export type DirectFundingRequested = ReturnType<typeof directFundingRequested>;

export const DIRECT_FUNDING_CONFIRMED = 'WALLET.INTERNAL.DIRECT_FUNDING_CONFIRMED';
export const directFundingConfirmed = (channelId: string) => ({
  type: DIRECT_FUNDING_CONFIRMED as typeof DIRECT_FUNDING_CONFIRMED,
  channelId,
});
export type DirectFundingConfirmed = ReturnType<typeof directFundingConfirmed>;

export const OPEN_LEDGER_CHANNEL = 'OPEN_LEDGER_CHANNEL';
export const openLedgerChannel = (appChannelId: string) => ({
  type: OPEN_LEDGER_CHANNEL as typeof OPEN_LEDGER_CHANNEL,
  appChannelId,
});
export type OpenLedgerChannel = ReturnType<typeof openLedgerChannel>;

export type InternalAction = DirectFundingRequested | DirectFundingConfirmed | OpenLedgerChannel;
