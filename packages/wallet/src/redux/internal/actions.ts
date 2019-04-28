import { WalletAction } from '../actions';

export const FUNDING_CONFIRMED = 'WALLET.INTERNAL.CHANNEL.FUNDING_CONFIRMED';
export const fundingConfirmed = (channelId: string) => ({
  type: FUNDING_CONFIRMED as typeof FUNDING_CONFIRMED,
  channelId,
});
export type FundingConfirmed = ReturnType<typeof fundingConfirmed>;

export type InternalChannelAction = FundingConfirmed;

export type InternalAction = InternalChannelAction;

export const isInternalAction = (action: WalletAction): action is InternalAction => {
  return action.type.match('WALLET.INTERNAL') ? true : false;
};

export const isChannelAction = (action: WalletAction): action is InternalChannelAction => {
  return action.type.match('WALLET.INTERNAL.CHANNEL') ? true : false;
};
