import * as walletStates from '../../state';
import * as states from './state';

import * as actions from '../../actions';

import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex } from '../../types';
import { channelID } from 'fmg-core/lib/channel';

import * as selectors from '../../selectors';
import {
  appChannelIsWaitingForFunding,
  receiveLedgerCommitment,
  createAndSendPostFundCommitment,
  ledgerChannelFundsAppChannel,
  confirmFundingForAppChannel,
} from '../reducer-helpers';

export function playerBReducer(
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
): walletStates.Initialized {
  if (!walletStates.indirectFundingOngoing(state)) {
    return state;
  }

  const indirectFunding = selectors.getIndirectFundingState(state);
  if (indirectFunding.channelId !== action.channelId) {
    return state;
  }

  if (state.indirectFunding.player !== PlayerIndex.B) {
    return state;
  }

  switch (state.indirectFunding.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(state, action);
    case states.WAIT_FOR_PRE_FUND_SETUP_0:
      return waitForPreFundSetup0Reducer(state, action);
    case states.WAIT_FOR_DIRECT_FUNDING:
      return state;
    case states.WAIT_FOR_POST_FUND_SETUP_0:
      return waitForPostFundSetup0Reducer(state, action);
    case states.WAIT_FOR_LEDGER_UPDATE_0:
      return state;
    default:
      return unreachable(state.indirectFunding);
  }
}

const waitForApprovalReducer = (
  state: walletStates.IndirectFundingOngoing,
  action: actions.indirectFunding.Action,
) => {
  switch (action.type) {
    case actions.indirectFunding.playerB.STRATEGY_PROPOSED:
      const { channelId } = action;
      return { ...state, indirectFunding: states.waitForPreFundSetup0({ channelId }) };
    default:
      return state;
  }
};

const waitForPreFundSetup0Reducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      let newState = { ...state };
      const { commitment, signature, channelId } = action;

      newState = receiveLedgerCommitment(newState, commitment, signature);

      const ledgerChannelId = channelID(commitment.channel);
      if (appChannelIsWaitingForFunding(state, channelId)) {
        newState = startDirectFunding(newState, channelId, ledgerChannelId);
      }
      return newState;
    default:
      return state;
  }
};

const waitForPostFundSetup0Reducer = (
  state: walletStates.Initialized,
  action: actions.indirectFunding.Action,
) => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      let newState = { ...state };
      const { commitment, signature } = action;
      const indirectFundingState = selectors.getIndirectFundingState(
        state,
      ) as states.WaitForPostFundSetup0;

      newState = receiveLedgerCommitment(newState, commitment, signature);

      newState = createAndSendPostFundCommitment(newState, indirectFundingState.ledgerId);
      newState.indirectFunding = states.waitForLedgerUpdate0(indirectFundingState);

      return newState;
    default:
      return state;
  }
};
function startDirectFunding(state: walletStates.Initialized, channelId, ledgerId) {
  state.indirectFunding = states.waitForDirectFunding({ channelId, ledgerId });
  return state;
}
