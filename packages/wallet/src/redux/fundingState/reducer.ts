import * as states from './state';
import * as actions from '../actions';

import { unreachable } from '../../utils/reducer-utils';

import { StateWithSideEffects } from '../shared/state';
import { directFundingStateReducer } from './directFunding/reducer';

type ReturnType = StateWithSideEffects<states.FundingState>;

export const fundingStateReducer = (
  state: states.FundingState,
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
    case actions.FUNDING_REQUESTED:
      return {
        state: states.waitForFundingApproval({
          ...state,
          fundingType: states.DIRECT_FUNDING, // TODO: This should come from the action
        }),
      };
    default:
      return { state };
  }
};
