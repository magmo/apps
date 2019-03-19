import * as states from './state';
import * as actions from '../actions';

import { unreachable, ReducerWithSideEffects } from '../../utils/reducer-utils';

import { StateWithSideEffects } from '../shared/state';
import { directFundingStateReducer } from './directFunding/reducer';
import { bigNumberify } from 'ethers/utils';

type ReturnType = StateWithSideEffects<states.FundingState>;

export const fundingStateReducer: ReducerWithSideEffects<states.FundingState> = (
  state: states.FundingState = states.waitForFundingRequest(),
  action: actions.WalletAction,
): ReturnType => {
  switch (state.fundingType) {
    //
    case states.UNKNOWN_FUNDING_TYPE:
      return unknownFundingTypeReducer(state, action);
    case states.DIRECT_FUNDING:
      return directFundingStateReducer(state, action);
    default:
      return unreachable(state);
  }
};

const unknownFundingTypeReducer = (
  state: states.WaitForFundingRequest,
  action: actions.WalletAction,
): ReturnType => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return {
        state: states.waitForFundingRequest(action),
      };
    case actions.internal.DIRECT_FUNDING_REQUESTED:
      const {
        safeToDepositLevel,
        totalFundingRequired,
        requiredDeposit,
        channelId,
        ourIndex,
      } = action;
      const channelFundingStatus =
        ourIndex === 0 ? states.SAFE_TO_DEPOSIT : states.NOT_SAFE_TO_DEPOSIT;
      if (
        state.destination === channelId &&
        state.totalForDestination &&
        bigNumberify(action.totalFundingRequired).lte(state.totalForDestination)
      ) {
        return {
          state: states.channelFunded({
            ...state,
            fundingType: states.DIRECT_FUNDING, // TODO: This should come from the action
            channelFundingStatus: states.CHANNEL_FUNDED,
            safeToDepositLevel,
            channelId,
            requestedTotalFunds: totalFundingRequired,
            requestedYourContribution: requiredDeposit,
            ourIndex,
          }),
        };
      } else {
        return {
          state: states.waitForFundingApproval({
            ...state,
            fundingType: states.DIRECT_FUNDING, // TODO: This should come from the action
            channelFundingStatus,
            safeToDepositLevel,
            channelId,
            requestedTotalFunds: totalFundingRequired,
            requestedYourContribution: requiredDeposit,
            ourIndex,
          }),
        };
      }
    default:
      return { state };
  }
};
