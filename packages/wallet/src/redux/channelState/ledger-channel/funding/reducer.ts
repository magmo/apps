import * as states from './state';
import * as actions from '.././../../actions';
import { StateWithSideEffects } from '../../../shared/state';
import { LedgerChannelStatus } from '../state';
import { validCommitmentSignature } from '../../../../utils/signing-utils';

export const fundingReducer = (
  state: states.FundingState,
  action: actions.WalletAction,
): StateWithSideEffects<LedgerChannelStatus> => {
  switch (state.type) {
    case states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP:
      return waitForFundingAndPostFundSetupReducer(state, action);
    default:
      return { state };
    // return unreachable(state);
  }
};

const waitForFundingAndPostFundSetupReducer = (
  state: states.WaitForFundingAndPostFundSetup,
  action: actions.WalletAction,
): StateWithSideEffects<
  | states.WaitForFundingConfirmation
  | states.WaitForPostFundSetup
  | states.WaitForFundingAndPostFundSetup
> => {
  switch (action.type) {
    case actions.internal.DIRECT_FUNDING_CONFIRMED:
      return {
        state: states.waitForPostFundSetup({ ...state }),
      };
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;

      const opponentAddress = state.participants[1 - state.ourIndex];
      // TODO:
      if (!validCommitmentSignature(commitment, signature, opponentAddress)) {
        // TODO: Better error handling
        console.error('Invalid signature');
        return { state };
      }
      return {
        state: states.waitForFundingConfirmation({
          ...state,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment, signature },
        }),
      };
    default:
      return { state };
  }
};
