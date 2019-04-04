import * as walletStates from '../state';
import * as selectors from '../selectors';
import * as channelStates from '../channel-state/state';

export const appChannelIsWaitingForFunding = (
  state: walletStates.Initialized,
  channelId: string,
): boolean => {
  const appChannel = selectors.getOpenedChannelState(state, channelId);
  return appChannel.type === channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP;
};
