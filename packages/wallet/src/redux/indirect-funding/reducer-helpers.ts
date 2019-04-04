import * as walletStates from '../state';
import * as selectors from '../selectors';
import * as channelStates from '../channel-state/state';

import * as actions from '../actions';
import * as channelActions from '../channel-state/actions';

import { channelStateReducer } from '../channel-state/reducer';
import { accumulateSideEffects } from '../outbox';
import { directFundingStoreReducer } from '../direct-funding-store/reducer';
import { Commitment } from 'fmg-core';

export const appChannelIsWaitingForFunding = (
  state: walletStates.Initialized,
  channelId: string,
): boolean => {
  const appChannel = selectors.getOpenedChannelState(state, channelId);
  return appChannel.type === channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP;
};

// Global state updaters
export const receiveLedgerCommitment = (
  state: walletStates.Initialized,
  commitment: Commitment,
  signature: string,
): walletStates.Initialized => {
  return updateChannelState(
    state,
    channelActions.opponentCommitmentReceived(commitment, signature),
  );
};

export const initializeChannelState = (
  state: walletStates.Initialized,
  channelId: string,
  address: string,
  privateKey: string,
): walletStates.Initialized => {
  // Create initial channel state for new ledger channel
  state.channelState.initializedChannels[channelId] = channelStates.waitForChannel({
    address,
    privateKey,
  });

  return state;
};

export const updateChannelState = (
  state: walletStates.Initialized,
  channelAction: actions.channel.ChannelAction,
): walletStates.Initialized => {
  const newState = { ...state };
  const updatedChannelState = channelStateReducer(newState.channelState, channelAction);
  newState.channelState = updatedChannelState.state;
  // App channel state may still generate side effects
  newState.outboxState = accumulateSideEffects(
    newState.outboxState,
    updatedChannelState.sideEffects,
  );
  return newState;
};

export const updateDirectFundingStatus = (
  state: walletStates.Initialized,
  action: actions.funding.FundingAction,
): walletStates.Initialized => {
  const newState = { ...state };
  const updatedDirectFundingStore = directFundingStoreReducer(state.directFundingStore, action);
  newState.directFundingStore = updatedDirectFundingStore.state;
  return newState;
};
