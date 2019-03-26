import * as states from '../state';
import { addHex } from '../../../../utils/hex-utils';
import * as actions from '../../../actions';
import {
  messageRelayRequested,
  fundingSuccess,
  fundingFailure,
  showWallet,
  hideWallet,
} from 'magmo-wallet-client/lib/wallet-events';

import { unreachable, validTransition } from '../../../../utils/reducer-utils';
import { validCommitmentSignature } from '../../../../utils/signing-utils';

import { Channel, Commitment } from 'fmg-core';
import { handleSignatureAndValidationMessages } from '../../../../utils/state-utils';
import { StateWithSideEffects } from '../../../shared/state';
import { composePostFundCommitment } from '../../shared/commitment-helpers';

export const fundingReducer = (
  state: states.FundingState,
  action: actions.WalletAction,
): StateWithSideEffects<states.AppChannelStatus> => {
  // Handle any signature/validation request centrally to avoid duplicating code for each state
  if (
    action.type === actions.OWN_COMMITMENT_RECEIVED ||
    action.type === actions.OPPONENT_COMMITMENT_RECEIVED
  ) {
    return {
      state,
      sideEffects: { messageOutbox: handleSignatureAndValidationMessages(state, action) },
    };
  }

  switch (state.type) {
    // Setup funding process
    case states.WAIT_FOR_FUNDING_REQUEST:
      return waitForFundingRequestReducer(state, action);
    case states.WAIT_FOR_FUNDING_APPROVAL:
      return approveFundingReducer(state, action);

    // Funding is ongoing
    case states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP:
      return waitForFundingAndPostFundSetupReducer(state, action);
    case states.WAIT_FOR_FUNDING_CONFIRMATION:
      return waitForFundingConfirmationReducer(state, action);
    case states.A_WAIT_FOR_POST_FUND_SETUP:
      return aWaitForPostFundSetupReducer(state, action);
    case states.B_WAIT_FOR_POST_FUND_SETUP:
      return bWaitForPostFundSetupReducer(state, action);

    // Ending the stage
    case states.ACKNOWLEDGE_FUNDING_SUCCESS:
      return acknowledgeFundingSuccessReducer(state, action);
    case states.SEND_FUNDING_DECLINED_MESSAGE:
      return sendFundingDeclinedMessageReducer(state, action);
    case states.ACKNOWLEDGE_FUNDING_DECLINED:
      return acknowledgeFundingDeclinedReducer(state, action);
    //
    default:
      return unreachable(state);
  }
};

const waitForFundingRequestReducer = (
  state: states.WaitForFundingRequest,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.FUNDING_REQUESTED:
      return {
        state: states.approveFunding({ ...state }),
        sideEffects: { displayOutbox: showWallet() },
      };
    default:
      return { state };
  }
};

const approveFundingReducer = (
  state: states.WaitForFundingApproval,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.FUNDING_APPROVED:
      const totalFundingRequired = state.lastCommitment.commitment.allocation.reduce(addHex);
      const safeToDepositLevel =
        state.ourIndex === 0
          ? '0x00'
          : state.lastCommitment.commitment.allocation.slice(0, state.ourIndex).reduce(addHex);
      const ourDeposit = state.lastCommitment.commitment.allocation[state.ourIndex];
      return {
        state: states.waitForFundingAndPostFundSetup(state),
        sideEffects: {
          actionOutbox: actions.internal.directFundingRequested(
            state.channelId,
            safeToDepositLevel,
            totalFundingRequired,
            ourDeposit,
            state.ourIndex,
          ),
        },
      };
    case actions.FUNDING_REJECTED:
      const sendFundingDeclinedAction = messageRelayRequested(
        state.participants[1 - state.ourIndex],
        'FundingDeclined',
      );
      return {
        state: states.sendFundingDeclinedMessage({ ...state }),
        sideEffects: { messageOutbox: sendFundingDeclinedAction, displayOutbox: hideWallet() },
      };
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return { state: states.acknowledgeFundingDeclined(state) };
      } else {
        return { state };
      }
    case actions.FUNDING_DECLINED_ACKNOWLEDGED:
      return { state: states.approveFunding({ ...state, unhandledAction: action }) };
    default:
      return { state };
  }
};

const waitForFundingAndPostFundSetupReducer = (
  state: states.WaitForFundingAndPostFundSetup,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      if (action.data === 'FundingDeclined') {
        return {
          state: states.acknowledgeFundingDeclined({ ...state }),
        };
      } else {
        return { state };
      }
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      if (!validTransitionToPostFundState(state, commitment, signature)) {
        return { state };
      }
      if (state.ourIndex === 0) {
        // Player B skipped our turn, and so we should ignore their message.
        return { state };
      } else {
        // Player A sent their post fund setup too early.
        // We shouldn't respond, but we store their commitment.
        return {
          state: states.waitForFundingConfirmation({
            ...state,
            turnNum: commitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: { commitment, signature },
          }),
        };
      }

    case actions.internal.DIRECT_FUNDING_CONFIRMED:
      if (action.channelId === state.channelId) {
        const channel: Channel = {
          channelType: state.libraryAddress,
          nonce: state.channelNonce,
          participants: state.participants,
        };
        const {
          postFundSetupCommitment,
          commitmentSignature,
          sendCommitmentAction,
        } = composePostFundCommitment(
          channel,
          state.lastCommitment.commitment,
          state.turnNum,
          state.ourIndex,
          state.privateKey,
        );

        const params = {
          ...state,
          turnNum: postFundSetupCommitment.turnNum,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: {
            commitment: postFundSetupCommitment,
            signature: commitmentSignature,
          },
        };

        if (state.ourIndex === 0) {
          return {
            state: states.aWaitForPostFundSetup(params),
            sideEffects: {
              messageOutbox: sendCommitmentAction,
            },
          };
        } else {
          return {
            state: states.bWaitForPostFundSetup({ ...state }),
            sideEffects: {
              messageOutbox: sendCommitmentAction,
            },
          };
        }
      } else {
        return { state };
      }

    case actions.TRANSACTION_CONFIRMED:
      // WARNING: This is pretty brittle
      if (state.funded) {
        // Player B can now confirm funding and is only waiting on post fund setup
        if (state.ourIndex === 0) {
          return {
            state: states.aWaitForPostFundSetup({ ...state }),
          };
        } else {
          return {
            state: states.bWaitForPostFundSetup({ ...state }),
          };
        }
      } else {
        return { state };
      }
    default:
      return { state };
  }
};

const aWaitForPostFundSetupReducer = (
  state: states.AWaitForPostFundSetup,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment: postFundState, signature } = action;
      if (!validTransitionToPostFundState(state, postFundState, signature)) {
        return { state };
      }

      return {
        state: states.acknowledgeFundingSuccess({
          ...state,
          turnNum: postFundState.turnNum,
          lastCommitment: { commitment: postFundState, signature },
          penultimateCommitment: state.lastCommitment,
        }),
      };
    default:
      return { state };
  }
};

const bWaitForPostFundSetupReducer = (
  state: states.BWaitForPostFundSetup,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      if (!validTransitionToPostFundState(state, commitment, signature)) {
        return { state };
      }

      const newState = { ...state, turnNum: commitment.turnNum };
      const channel: Channel = {
        channelType: newState.libraryAddress,
        nonce: newState.channelNonce,
        participants: newState.participants,
      };
      const {
        postFundSetupCommitment,
        commitmentSignature,
        sendCommitmentAction,
      } = composePostFundCommitment(
        channel,
        newState.lastCommitment.commitment,
        newState.turnNum,
        newState.ourIndex,
        newState.privateKey,
      );
      return {
        state: states.acknowledgeFundingSuccess({
          ...newState,
          turnNum: postFundSetupCommitment.turnNum,
          lastCommitment: { commitment: postFundSetupCommitment, signature: commitmentSignature },
          penultimateCommitment: { commitment, signature },
        }),
        sideEffects: { messageOutbox: sendCommitmentAction },
      };
    default:
      return { state };
  }
};

const waitForFundingConfirmationReducer = (
  state: states.WaitForFundingConfirmation,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.internal.DIRECT_FUNDING_CONFIRMED:
      if (state.channelId === action.channelId) {
        const channel: Channel = {
          channelType: state.libraryAddress,
          nonce: state.channelNonce,
          participants: state.participants,
        };
        const {
          postFundSetupCommitment,
          commitmentSignature,
          sendCommitmentAction,
        } = composePostFundCommitment(
          channel,
          state.lastCommitment.commitment,
          state.turnNum,
          state.ourIndex,
          state.privateKey,
        );

        return {
          state: states.acknowledgeFundingSuccess({
            ...state,
            turnNum: postFundSetupCommitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: {
              commitment: postFundSetupCommitment,
              signature: commitmentSignature,
            },
          }),
          sideEffects: { messageOutbox: sendCommitmentAction },
        };
      } else {
        return { state };
      }

    default:
      return { state };
  }
};

const acknowledgeFundingDeclinedReducer = (
  state: states.AcknowledgeFundingDeclined,
  action: actions.WalletAction,
): StateWithSideEffects<states.AppChannelStatus> => {
  switch (action.type) {
    case actions.FUNDING_DECLINED_ACKNOWLEDGED:
      return {
        state: states.waitForChannel({
          ...state,
        }),
        sideEffects: {
          messageOutbox: fundingFailure(state.channelId, 'FundingDeclined'),
          displayOutbox: hideWallet(),
        },
      };
  }
  return { state };
};

const sendFundingDeclinedMessageReducer = (
  state: states.SendFundingDeclinedMessage,
  action: actions.WalletAction,
): StateWithSideEffects<states.WaitForChannel | states.SendFundingDeclinedMessage> => {
  switch (action.type) {
    case actions.MESSAGE_SENT:
      return {
        state: states.waitForChannel({
          ...state,
        }),
        sideEffects: {
          messageOutbox: fundingFailure(state.channelId, 'FundingDeclined'),
          displayOutbox: hideWallet(),
        },
      };
  }
  return { state };
};
const acknowledgeFundingSuccessReducer = (
  state: states.AcknowledgeFundingSuccess,
  action: actions.WalletAction,
): StateWithSideEffects<states.OpenedState> => {
  switch (action.type) {
    case actions.FUNDING_SUCCESS_ACKNOWLEDGED:
      return {
        state: states.waitForUpdate({
          ...state,
        }),
        sideEffects: {
          displayOutbox: hideWallet(),
          messageOutbox: fundingSuccess(state.channelId, state.lastCommitment.commitment),
        },
      };
    default:
      return { state };
  }
};

const validTransitionToPostFundState = (
  state: states.FundingState,
  data: Commitment,
  signature: string | undefined,
) => {
  if (!signature) {
    return false;
  }

  const opponentAddress = state.participants[1 - state.ourIndex];

  if (!validCommitmentSignature(data, signature, opponentAddress)) {
    return false;
  }
  if (!validTransition(state, data)) {
    return false;
  }
  if (data.commitmentType !== 1) {
    return false;
  }
  return true;
};
