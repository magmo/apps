import { InitializedState } from './state';

import * as actions from '../actions';
import { combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { channelStateReducer } from '../channelState/reducer';
import { fundingStateReducer } from '../fundingState/reducer';
import { accumulateSideEffects } from '../outbox';
import { getChannelStatus, getDirectFundingStatus } from '../state';
import { stateIsChannelFunded } from '../fundingState/state';
import { fundingReducer } from '../channelState/funding/reducer';
import { WAIT_FOR_FUNDING_AND_POST_FUND_SETUP } from '../channelState/state';

export function initializedReducer(
  state: InitializedState,
  action: actions.WalletAction,
): InitializedState {
  // Apply the "independent" reducer
  const { state: newState, sideEffects } = combinedReducer(state, action);
  // Since the wallet state itself has an outbox state, we need to apply the side effects
  // by hand.
  const updatedState = {
    ...state,
    ...newState,
    outboxState: accumulateSideEffects(state.outboxState, sideEffects),
  };

  // Inspect the global state for interactions
  return coordinator(updatedState, action);
}
const combinedReducer = combineReducersWithSideEffects({
  channelState: channelStateReducer,
  fundingState: fundingStateReducer,
});

export function coordinator(
  state: InitializedState,
  action: actions.WalletAction,
): InitializedState {
  switch (action.type) {
    case actions.funding.FUNDING_RECEIVED_EVENT:
      return fundingReceivedEventCoordinator(state, action);
    default:
      return state;
  }
}

function fundingReceivedEventCoordinator(
  state: InitializedState,
  action: actions.funding.FundingReceivedEvent,
): InitializedState {
  const { channelId } = action;
  const channelStatus = getChannelStatus(state, channelId);
  if (channelStatus.type !== WAIT_FOR_FUNDING_AND_POST_FUND_SETUP) {
    return state;
  }
  const fundingStatus = getDirectFundingStatus(state, channelId);

  const newState = { ...state };
  if (stateIsChannelFunded(fundingStatus)) {
    const { state: newChannelStatus, sideEffects } = fundingReducer(
      channelStatus,
      actions.internal.directFundingConfirmed(channelId),
    );

    newState.channelState.initializedChannels[channelId] = newChannelStatus;
    newState.outboxState = accumulateSideEffects(newState.outboxState, sideEffects);
  }

  return newState;
}
