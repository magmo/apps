import * as states from '../state';
import * as actions from '../../actions';

import { unreachable } from '../../../utils/reducer-utils';
import { createDepositTransaction } from '../../../utils/transaction-generator';

import { bigNumberify } from 'ethers/utils';
import { DIRECT_FUNDING } from '../state';
import { StateWithSideEffects } from 'src/redux/shared/state';

export const directFundingStateReducer = (
  state: states.DirectFundingState,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (state.type) {
    //
    case states.WAIT_FOR_FUNDING_APPROVAL:
      return waitForFundingApprovalReducer(state, action);
    case states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK:
      return aWaitForDepositToBeSentToMetaMaskReducer(state, action);
    case states.A_SUBMIT_DEPOSIT_IN_METAMASK:
      return aSubmitDepositToMetaMaskReducer(state, action);
    case states.A_WAIT_FOR_DEPOSIT_CONFIRMATION:
      return aWaitForDepositConfirmationReducer(state, action);
    case states.A_WAIT_FOR_OPPONENT_DEPOSIT:
      return aWaitForOpponentDepositReducer(state, action);
    //
    case states.B_WAIT_FOR_OPPONENT_DEPOSIT:
      return bWaitForOpponentDepositReducer(state, action);
    case states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK:
      return bWaitForDepositToBeSentToMetaMaskReducer(state, action);
    case states.B_SUBMIT_DEPOSIT_IN_METAMASK:
      return bSubmitDepositInMetaMaskReducer(state, action);
    case states.B_WAIT_FOR_DEPOSIT_CONFIRMATION:
      return bWaitForDepositConfirmationReducer(state, action);
    //
    case states.A_DEPOSIT_TRANSACTION_FAILED:
      return aDepositTransactionFailedReducer(state, action);
    case states.B_DEPOSIT_TRANSACTION_FAILED:
      return bDepositTransactionFailedReducer(state, action);
    case states.FUNDING_CONFIRMED:
      return { state };
    default:
      return unreachable(state);
  }
};

const waitForFundingApprovalReducer = (
  state: states.WaitForFundingApproval,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_APPROVED:
      if (state.ourIndex === 0) {
        return {
          state: states.aWaitForDepositToBeSentToMetaMask({
            ...state,
            fundingType: DIRECT_FUNDING,
          }),
          outboxState: {
            transactionOutbox: createDepositTransaction(
              state.channelId,
              state.requestedYourContribution,
            ),
          },
        };
      } else {
        return {
          state: states.bWaitForOpponentDeposit({
            ...state,
            fundingType: DIRECT_FUNDING,
          }),
        };
      }
    default:
      return { state };
  }
};

const aWaitForDepositToBeSentToMetaMaskReducer = (
  state: states.AWaitForDepositToBeSentToMetaMask,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return { state: states.aSubmitDepositInMetaMask(state) };
    case actions.FUNDING_RECEIVED_EVENT:
      return {
        state: states.aWaitForDepositToBeSentToMetaMask({
          ...state,
        }),
      };
    default:
      return { state };
  }
};

const aSubmitDepositToMetaMaskReducer = (
  state: states.ASubmitDepositInMetaMask,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return {
        state: states.aSubmitDepositInMetaMask({ ...state }),
      };
    case actions.TRANSACTION_SUBMITTED:
      return {
        state: states.aWaitForDepositConfirmation({
          ...state,
          transactionHash: action.transactionHash,
        }),
      };
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { state: states.aDepositTransactionFailed(state) };
    default:
      return { state };
  }
};

const aWaitForDepositConfirmationReducer = (
  state: states.AWaitForDepositConfirmation,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return {
        state: states.aWaitForDepositConfirmation({ ...state }),
      };
    case actions.TRANSACTION_CONFIRMED:
      return { state: states.aWaitForOpponentDeposit(state) };
    default:
      return { state };
  }
};

const aWaitForOpponentDepositReducer = (
  state: states.AWaitForOpponentDeposit,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (sufficientlyFundedToProgress('A', state, action)) {
        return { state: states.fundingConfirmed(state) };
      } else {
        return { state };
      }
    default:
      return { state };
  }
};

const bWaitForOpponentDepositReducer = (
  state: states.BWaitForOpponentDeposit,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (state.channelId !== action.destination) {
        return { state };
      }
      if (
        bigNumberify(action.totalForDestination).lt(
          bigNumberify(state.requestedTotalFunds).sub(state.requestedYourContribution),
        )
      ) {
        return { state };
      }

      return {
        state: states.bWaitForDepositToBeSentToMetaMask({ ...state }),
        outboxState: {
          transactionOutbox: createDepositTransaction(
            state.channelId,
            state.requestedYourContribution,
          ),
        },
      };
    default:
      return { state };
  }
};

const bWaitForDepositToBeSentToMetaMaskReducer = (
  state: states.BWaitForDepositToBeSentToMetaMask,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return { state: states.bSubmitDepositInMetaMask(state) };
    default:
      return { state };
  }
};

const bSubmitDepositInMetaMaskReducer = (
  state: states.BSubmitDepositInMetaMask,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    // This case should not happen in theory, but it does in practice.
    // B submits deposit transaction, transaction is confirmed, A sends postfundset, B receives postfundsetup
    // All of the above happens before B receives transaction submitted
    case actions.TRANSACTION_SUBMITTED:
      return {
        state: states.bWaitForDepositConfirmation({
          ...state,
          transactionHash: action.transactionHash,
        }),
      };
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { state: states.bDepositTransactionFailed(state) };
    default:
      return { state };
  }
};

const aDepositTransactionFailedReducer = (
  state: states.ADepositTransactionFailed,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      return {
        state: states.aWaitForDepositToBeSentToMetaMask({
          ...state,
        }),
        outboxState: {
          transactionOutbox: createDepositTransaction(
            state.channelId,
            state.requestedYourContribution,
          ),
        },
      };
  }
  return { state };
};

const bDepositTransactionFailedReducer = (
  state: states.BDepositTransactionFailed,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      return {
        state: states.bWaitForDepositToBeSentToMetaMask({ ...state }),
        outboxState: {
          transactionOutbox: createDepositTransaction(
            state.channelId,
            state.requestedYourContribution,
          ),
        },
      };
  }
  return { state };
};

const bWaitForDepositConfirmationReducer = (
  state: states.BWaitForDepositConfirmation,
  action: actions.WalletAction,
): StateWithSideEffects<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
    case actions.TRANSACTION_CONFIRMED:
      return { state: states.fundingConfirmed(state) };
    default:
      return { state };
  }
};

function sufficientlyFundedToProgress(player: 'A' | 'B', state, action) {
  if (state.channelId !== action.destination) {
    return false;
  }
  if (player === 'A' && bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)) {
    return true;
  }

  if (
    player === 'B' &&
    bigNumberify(action.totalForDestination).gte(
      bigNumberify(state.requestedTotalFunds).sub(bigNumberify(state.requestedYourContribution)),
    )
  ) {
    return true;
  }

  return false;
}
