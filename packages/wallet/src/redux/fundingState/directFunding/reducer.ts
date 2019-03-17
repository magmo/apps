import * as states from './state';
import * as actions from '../../actions';

import { unreachable } from '../../../utils/reducer-utils';

import { StateWithSideEffects } from 'src/redux/shared/state';
import { depositingReducer } from './depositingReducer';
import { bigNumberify } from 'ethers/utils';

export const directFundingStateReducer = (
  state: states.DirectFundingState,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  if (states.stateIsWaitForFundingApproval(state)) {
    return waitForFundingApprovalReducer(state, action);
  }
  if (states.stateIsNotSafeToDeposit(state)) {
    return notSafeToDepositReducer(state, action);
  }
  if (states.stateIsDepositing(state)) {
    return depositingReducer(state, action);
  }
  if (states.stateIsWaitForFundingConfirmation(state)) {
    return waitForFundingConfirmationReducer(state, action);
  }
  if (states.stateIsChannelFunded(state)) {
    return channelFundedReducer(state, action);
  }

  return unreachable(state);
};

const waitForFundingApprovalReducer = (
  state: states.WaitForFundingApproval,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_APPROVED:
      return {
        state: states.notSafeToDeposit({ ...state }),
      };
    default:
      return { state };
  }
};

const notSafeToDepositReducer = (
  state: states.NotSafeToDeposit,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (bigNumberify(action.totalForDestination).gte(state.safeToDepositLevel)) {
        return {
          state: states.submitDepositToMetaMask({ ...state }),
        };
      } else {
        return { state };
      }
    default:
      return { state };
  }
};

const waitForFundingConfirmationReducer = (
  state: states.WaitForFundingConfirmation,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)) {
        return { state: states.channelFunded(state) };
      } else {
        return { state };
      }
    default:
      return { state };
  }
};

const channelFundedReducer = (
  state: states.ChannelFunded,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT) {
    if (bigNumberify(action.totalForDestination).lt(state.requestedTotalFunds)) {
      // TODO: Deal with chain re-orgs here.
      return { state };
    }
  }
  return { state };
};
