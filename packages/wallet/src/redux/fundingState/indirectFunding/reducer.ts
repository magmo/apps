import * as states from './state';
import * as actions from '../../actions';
import { StateWithSideEffects } from 'src/redux/shared/state';

import { unreachable } from '../../../utils/reducer-utils';

export const indirectFundingStateReducer = (
  state: states.IndirectFundingState,
  action: actions.WalletAction,
): StateWithSideEffects<states.IndirectFundingState> => {
  if (states.stateIsFunderChannelDoesNotExist(state)) {
    return funderChannelDoesNotExistReducer(state, action);
  }

  if (states.stateIsFunderChannelExists(state)) {
    return funderChannelExistsReducer(state, action);
  }

  if (states.stateIsChannelFunded(state)) {
    return channelFundedReducer(state, action);
  }

  return unreachable(state);
};

const funderChannelDoesNotExistReducer = (
  state: states.FunderChannelDoesNotExist,
  action: actions.WalletAction,
): StateWithSideEffects<states.IndirectFundingState> => {
  switch (action.type) {
    case actions.internal.OPEN_CHANNEL_SUCCESS:
      return { state: states.funderChannelExists(state, action.channelId) };
    default:
      return { state };
  }
};

const funderChannelExistsReducer = (
  state: states.FunderChannelExists,
  action: actions.WalletAction,
): StateWithSideEffects<states.IndirectFundingState> => {
  switch (action.type) {
    case actions.internal.CONSENSUS_REACHED:
      if (action.channelId === state.funderChannelId) {
        return { state: states.channelFunded(state, action.channelId) };
      }
      return { state };
    default:
      return { state };
  }
};

const channelFundedReducer = (
  state: states.ChannelFunded,
  action: actions.WalletAction,
): StateWithSideEffects<states.IndirectFundingState> => {
  return { state };
};
