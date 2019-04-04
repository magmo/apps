import * as walletStates from '../state';
import * as actions from '../actions';
import * as channelState from '../channel-state/state';

import { channelStateReducer } from '../channel-state/reducer';
import { fundingStateReducer } from '../funding-state/reducer';
import { accumulateSideEffects } from '../outbox';
// TODO: These all update state and can probably be stored in a file together.
export const initializeChannelState = (
  state: walletStates.Initialized,
  channelId: string,
  address: string,
  privateKey: string,
) => {
  // Create initial channel state for new ledger channel
  state.channelState.initializedChannels[channelId] = channelState.waitForChannel({
    address,
    privateKey,
  });
};
export const updateChannelState = (
  state: walletStates.Initialized,
  channelAction: actions.channel.ChannelAction,
) => {
  const updatedChannelState = channelStateReducer(state.channelState, channelAction);
  state.channelState = updatedChannelState.state;
  // App channel state may still generate side effects
  state.outboxState = accumulateSideEffects(state.outboxState, updatedChannelState.sideEffects);
};
export const updateFundingState = (
  state: walletStates.Initialized,
  action: actions.funding.FundingAction,
) => {
  const updatedFundingState = fundingStateReducer(state.fundingState, action);
  state.fundingState = updatedFundingState.state;
};
