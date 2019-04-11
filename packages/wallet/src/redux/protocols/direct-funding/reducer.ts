import * as states from './state';
import * as actions from '../../actions';
import * as depositingStates from './depositing/state';

import { unreachable } from '../../../utils/reducer-utils';
import { StateWithSideEffects } from 'src/redux/utils';
import { depositingReducer } from './depositing/reducer';
import { bigNumberify } from 'ethers/utils';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import { WalletProcedure } from '../../types';
import { ProtocolReducer, ProtocolStateWithSharedData, SharedData } from '../../protocols';
import { SideEffects } from '../../outbox/state';
import { accumulateSideEffects } from '../../outbox';

export const directFundingStateReducer: ProtocolReducer<states.DirectFundingState> = (
  state: states.DirectFundingState,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT && action.channelId === state.channelId) {
    // You can always move to CHANNEL_FUNDED based on the action
    // of some arbitrary actor, so this behaviour is common regardless of the stage of
    // the state
    if (bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)) {
      return {
        protocolState: states.channelFunded(state),
        sharedData,
      };
    }
  }

  if (states.stateIsNotSafeToDeposit(state)) {
    return applyUpdate(state, sharedData, notSafeToDepositReducer(state, action));
  }
  if (states.stateIsDepositing(state)) {
    return depositingReducer(state, sharedData, action);
  }
  if (states.stateIsWaitForFundingConfirmation(state)) {
    return applyUpdate(state, sharedData, waitForFundingConfirmationReducer(state, action));
  }
  if (states.stateIsChannelFunded(state)) {
    return applyUpdate(state, sharedData, channelFundedReducer(state, action));
  }
  return unreachable(state);
};

function applyUpdate(
  state: states.DirectFundingState,
  sharedData: SharedData,
  updateData: { state: states.DirectFundingState; sideEffects?: SideEffects },
): ProtocolStateWithSharedData<states.DirectFundingState> {
  const { state: protocolState, sideEffects } = updateData;
  return {
    protocolState,
    sharedData: {
      ...sharedData,
      outboxState: accumulateSideEffects(sharedData.outboxState, sideEffects),
    },
  };
}

const notSafeToDepositReducer = (
  state: states.NotSafeToDeposit,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
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
    case actions.FUNDING_RECEIVED_EVENT:
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
  if (action.type === actions.FUNDING_RECEIVED_EVENT) {
    if (bigNumberify(action.totalForDestination).lt(state.requestedTotalFunds)) {
      // TODO: Deal with chain re-orgs that de-fund the channel here
      return { state };
    }
  }
  return { state };
};
