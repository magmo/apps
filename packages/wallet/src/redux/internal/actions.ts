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

export const OPEN_CHANNEL_SUCCESS = 'WALLET.INTERNAL.OPEN_CHANNEL_SUCCESS';
export const openChannelSuccess = (channelId: string) => ({
  type: OPEN_CHANNEL_SUCCESS as typeof OPEN_CHANNEL_SUCCESS,
  channelId,
});
export type OpenChannelSuccess = ReturnType<typeof openChannelSuccess>;

// TODO: is the last committment needed?
export const CONSENSUS_REACHED = 'WALLET.INTERNAL.CONSENSUS_REACHED';
export const consenusReached = (channelId: string) => ({
  type: CONSENSUS_REACHED as typeof CONSENSUS_REACHED,
  channelId,
});
export type ConsensusReached = ReturnType<typeof consenusReached>;

export type InternalAction =
  | DirectFundingRequested
  | DirectFundingConfirmed
  | OpenChannelSuccess
  | ConsensusReached;
