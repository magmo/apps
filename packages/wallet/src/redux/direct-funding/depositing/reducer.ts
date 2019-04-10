import { unreachable } from '../../../utils/reducer-utils';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import { StateWithSideEffects } from '../../utils';

import * as actions from '../../actions';
import * as states from './state';
import * as fundingStates from '../state';
import { WalletProcedure } from '../../types';
import { ProtocolReducer, ProtocolStateWithSharedData } from '../../protocols';
import { SideEffects } from '../../outbox/state';
import { accumulateSideEffects } from '../../outbox';

export const depositingReducer: ProtocolReducer<fundingStates.DirectFundingState> = (
  state: ProtocolStateWithSharedData<states.Depositing>,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<fundingStates.DirectFundingState> => {
  const { protocolState } = state;

  switch (protocolState.depositStatus) {
    case states.WAIT_FOR_TRANSACTION_SENT:
      return applyUpdate(state, waitForTransactionSentReducer(protocolState, action));
    case states.WAIT_FOR_DEPOSIT_APPROVAL:
      return applyUpdate(state, waitForDepositApprovalReducer(protocolState, action));
    case states.WAIT_FOR_DEPOSIT_CONFIRMATION:
      return applyUpdate(state, waitForDepositConfirmationReducer(protocolState, action));
    case states.DEPOSIT_TRANSACTION_FAILED:
      return applyUpdate(state, depositTransactionFailedReducer(protocolState, action));
  }
  return unreachable(protocolState);
};

function applyUpdate(
  state: ProtocolStateWithSharedData<fundingStates.DirectFundingState>,
  updateData: { state: fundingStates.DirectFundingState; sideEffects?: SideEffects },
): ProtocolStateWithSharedData<fundingStates.DirectFundingState> {
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

const waitForTransactionSentReducer = (
  state: states.WaitForTransactionSent,
  action: actions.WalletAction,
): StateWithSideEffects<states.Depositing> => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return {
        state: states.waitForDepositApproval(state),
      };
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { state: states.depositTransactionFailed(state) };
    default:
      return { state };
  }
};

const waitForDepositApprovalReducer = (
  state: states.WaitForDepositApproval,
  action: actions.WalletAction,
): StateWithSideEffects<states.Depositing> => {
  switch (action.type) {
    case actions.TRANSACTION_SUBMITTED:
      return {
        state: states.waitForDepositConfirmation({
          ...state,
          transactionHash: action.transactionHash,
        }),
      };
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { state: states.depositTransactionFailed(state) };
    default:
      return { state };
  }
};

const waitForDepositConfirmationReducer = (
  state: states.WaitForDepositConfirmation,
  action: actions.WalletAction,
): StateWithSideEffects<fundingStates.DirectFundingState> => {
  switch (action.type) {
    case actions.TRANSACTION_CONFIRMED:
      return { state: fundingStates.waitForFundingConfirmed(state) };
    default:
      return { state };
  }
};

const depositTransactionFailedReducer = (
  state: states.DepositTransactionFailed,
  action: actions.WalletAction,
): StateWithSideEffects<states.Depositing> => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      return {
        state: states.waitForTransactionSent({
          ...state,
        }),
        sideEffects: {
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
  }
  return { state };
};
