import * as states from './state';
import * as actions from '../actions';
import * as depositingStates from './depositing/state';

import { unreachable } from '../../utils/reducer-utils';
import { StateWithSideEffects } from 'src/redux/utils';
import { depositingReducer } from './depositing/reducer';
import { bigNumberify } from 'ethers/utils';
import { createDepositTransaction } from '../../utils/transaction-generator';
import { WalletProcedure } from '../types';
import { ProtocolReducer, ProtocolStateWithSharedData } from '../protocols';
import { SideEffects } from '../outbox/state';
import { accumulateSideEffects } from '../outbox';

export const directFundingStateReducer: ProtocolReducer<states.DirectFundingState> = (
  state: ProtocolStateWithSharedData<states.DirectFundingState>,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  const { protocolState, sharedData } = state;
  if (
    action.type === actions.funding.FUNDING_RECEIVED_EVENT &&
    action.channelId === protocolState.channelId
  ) {
    // You can always move to CHANNEL_FUNDED based on the action
    // of some arbitrary actor, so this behaviour is common regardless of the stage of
    // the state
    if (bigNumberify(action.totalForDestination).gte(protocolState.requestedTotalFunds)) {
      return {
        protocolState: states.channelFunded(protocolState),
        sharedData,
      };
    }
  }

  if (states.stateIsNotSafeToDeposit(protocolState)) {
    return applyUpdate(state, notSafeToDepositReducer(protocolState, action));
  }
  if (states.stateIsDepositing(protocolState)) {
    return depositingReducer(state, action);
  }
  if (states.stateIsWaitForFundingConfirmation(protocolState)) {
    return applyUpdate(state, waitForFundingConfirmationReducer(protocolState, action));
  }
  if (states.stateIsChannelFunded(protocolState)) {
    return applyUpdate(state, channelFundedReducer(protocolState, action));
  }
  return unreachable(protocolState);
};

function applyUpdate(
  state: ProtocolStateWithSharedData<states.DirectFundingState>,
  updateData: { state: states.DirectFundingState; sideEffects?: SideEffects },
): ProtocolStateWithSharedData<states.DirectFundingState> {
  const { state: protocolState, sideEffects } = updateData;
  return {
    ...state,
    protocolState,
    sharedData: {
      ...state.sharedData,
      outboxState: accumulateSideEffects(state.sharedData.outboxState, sideEffects),
    },
  };
}

const notSafeToDepositReducer = (
  state: states.NotSafeToDeposit,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.funding.FUNDING_RECEIVED_EVENT:
      if (
        action.channelId === state.channelId &&
        bigNumberify(action.totalForDestination).gte(state.safeToDepositLevel)
      ) {
        return {
          state: depositingStates.waitForTransactionSent({ ...state }),
          sideEffects: {
            // TODO: This will be factored out as channel reducers should not be sending transactions itself
            transactionOutbox: {
              transactionRequest: createDepositTransaction(
                state.channelId,
                state.requestedYourContribution,
              ),
              channelId: action.channelId,
              procedure: WalletProcedure.DirectFunding,
            },
          },
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
  // TODO: This code path is unreachable, but the compiler doesn't know that.
  // Can we fix that?
  switch (action.type) {
    case actions.funding.FUNDING_RECEIVED_EVENT:
      if (
        action.channelId === state.channelId &&
        bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)
      ) {
        return {
          state: states.channelFunded(state),
        };
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
  if (action.type === actions.funding.FUNDING_RECEIVED_EVENT) {
    if (bigNumberify(action.totalForDestination).lt(state.requestedTotalFunds)) {
      // TODO: Deal with chain re-orgs that de-fund the channel here
      return { state };
    }
  }
  return { state };
};
