import * as states from '../states';
import * as actions from '../actions';

import { ClosingState } from '../states';
import { WalletAction } from '../actions';
import { unreachable, ourTurn, validTransition } from '../../utils/reducer-utils';
import {
  signCommitment,
  signVerificationData,
  validCommitmentSignature,
} from '../../utils/signing-utils';
import {
  commitmentRelayRequested,
  closeSuccess,
  concludeSuccess,
  concludeFailure,
  hideWallet,
} from 'magmo-wallet-client/lib/wallet-events';
import { CommitmentType, Commitment } from 'fmg-core';
import {
  createConcludeAndWithdrawTransaction,
  ConcludeAndWithdrawArgs,
} from '../../utils/transaction-generator';
import { NextChannelState } from '../states/shared';

export const closingReducer = (
  state: ClosingState,
  action: WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (state.type) {
    case states.APPROVE_CONCLUDE:
      return approveConcludeReducer(state, action);
    case states.WAIT_FOR_OPPONENT_CONCLUDE:
      return waitForOpponentConclude(state, action);
    case states.APPROVE_CLOSE_ON_CHAIN:
      return approveCloseOnChainReducer(state, action);
    case states.ACKNOWLEDGE_CLOSE_SUCCESS:
      return acknowledgeCloseSuccessReducer(state, action);
    case states.ACKNOWLEDGE_CLOSED_ON_CHAIN:
      return acknowledgeClosedOnChainReducer(state, action);
    case states.WAIT_FOR_CLOSE_INITIATION:
      return waitForCloseInitiatorReducer(state, action);
    case states.WAIT_FOR_CLOSE_SUBMISSION:
      return waitForCloseSubmissionReducer(state, action);
    case states.WAIT_FOR_CLOSE_CONFIRMED:
      return waitForCloseConfirmedReducer(state, action);
    case states.ACKNOWLEDGE_CONCLUDE:
      return acknowledgeConcludeReducer(state, action);
    case states.CLOSE_TRANSACTION_FAILED:
      return closeTransactionFailedReducer(state, action);
    default:
      return unreachable(state);
  }
};

const closeTransactionFailedReducer = (
  state: states.CloseTransactionFailed,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const { penultimateCommitment: from, lastCommitment: to } = state;
      const myAddress = state.participants[state.ourIndex];
      const amount = to.commitment.allocation[state.ourIndex];
      // TODO: The sender could of changed since the transaction failed. We'll need to check for the updated address.
      const verificationSignature = signVerificationData(
        myAddress,
        state.userAddress,
        amount,
        state.userAddress,
        state.privateKey,
      );
      const args: ConcludeAndWithdrawArgs = {
        fromCommitment: from.commitment,
        toCommitment: to.commitment,
        fromSignature: from.signature,
        toSignature: to.signature,
        verificationSignature,
        amount,
        participant: myAddress,
        destination: state.userAddress,
      };
      const transactionOutbox = createConcludeAndWithdrawTransaction(args);
      return { channelState: states.waitForCloseSubmission({ ...state, transactionOutbox }) };
  }
  return { channelState: state };
};

const acknowledgeConcludeReducer = (
  state: states.AcknowledgeConclude,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.CONCLUDE_APPROVED:
      if (!ourTurn(state)) {
        return {
          channelState: state,
          displayOutbox: hideWallet(),
          messageOutbox: concludeFailure('Other', "It is not the current user's turn"),
        };
      }
      const {
        positionSignature,
        sendCommitmentAction,
        concludeCommitment,
      } = composeConcludePosition(state);
      const lastState = state.lastCommitment.commitment;
      if (lastState.commitmentType === CommitmentType.Conclude) {
        return {
          channelState: states.approveCloseOnChain({
            ...state,
            turnNum: concludeCommitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
          }),
          messageOutbox: sendCommitmentAction,
        };
      }
  }
  return { channelState: state };
};

const waitForCloseConfirmedReducer = (
  state: states.WaitForCloseConfirmed,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.TRANSACTION_CONFIRMED:
      return {
        channelState: states.acknowledgeCloseSuccess({ ...state }),
        messageOutbox: closeSuccess(),
      };
  }
  return { channelState: state };
};

const waitForCloseInitiatorReducer = (
  state: states.WaitForCloseInitiation,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return { channelState: states.waitForCloseSubmission(state) };
  }
  return { channelState: state };
};

const waitForCloseSubmissionReducer = (
  state: states.WaitForCloseSubmission,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { channelState: states.closeTransactionFailed(state) };
    case actions.TRANSACTION_SUBMITTED:
      return {
        channelState: states.waitForCloseConfirmed({
          ...state,
          transactionHash: action.transactionHash,
        }),
      };
  }
  return { channelState: state };
};

const approveCloseOnChainReducer = (
  state: states.ApproveCloseOnChain,
  action: actions.WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.APPROVE_CLOSE:
      const { penultimateCommitment: from, lastCommitment: to } = state;
      const myAddress = state.participants[state.ourIndex];
      const amount = to.commitment.allocation[state.ourIndex];
      // TODO: The sender could of changed since the transaction failed. We'll need to check for the updated address.
      const verificationSignature = signVerificationData(
        myAddress,
        action.withdrawAddress,
        amount,
        action.withdrawAddress,
        state.privateKey,
      );
      const args: ConcludeAndWithdrawArgs = {
        fromCommitment: from.commitment,
        toCommitment: to.commitment,
        fromSignature: from.signature,
        toSignature: to.signature,
        verificationSignature,
        amount,
        participant: myAddress,
        destination: action.withdrawAddress,
      };
      const transactionOutbox = createConcludeAndWithdrawTransaction(args);
      return {
        channelState: states.waitForCloseInitiation({
          ...state,
          userAddress: action.withdrawAddress,
          transactionOutbox,
        }),
      };
  }
  return { channelState: state };
};

const approveConcludeReducer = (
  state: states.ApproveConclude,
  action: WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.CONCLUDE_APPROVED:
      if (!ourTurn(state)) {
        return {
          channelState: state,
          displayOutbox: hideWallet(),
          messageOutbox: concludeFailure('Other', "It is not the current user's turn"),
        };
      }

      const {
        concludeCommitment,
        positionSignature,
        sendCommitmentAction,
      } = composeConcludePosition(state);
      const { lastCommitment } = state;
      if (lastCommitment.commitment.commitmentType === CommitmentType.Conclude) {
        return {
          channelState: states.approveCloseOnChain({
            ...state,
            turnNum: concludeCommitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
          }),
          messageOutbox: sendCommitmentAction,
        };
      } else {
        return {
          channelState: states.waitForOpponentConclude({
            ...state,
            turnNum: concludeCommitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
          }),
          messageOutbox: sendCommitmentAction,
        };
      }
      break;
    case actions.CONCLUDE_REJECTED:
      return {
        channelState: states.waitForUpdate({
          ...state,
        }),
        displayOutbox: hideWallet(),
        messageOutbox: concludeFailure('UserDeclined'),
      };
    default:
      return { channelState: state };
  }
};

const waitForOpponentConclude = (
  state: states.WaitForOpponentConclude,
  action: WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;

      const opponentAddress = state.participants[1 - state.ourIndex];
      if (!validCommitmentSignature(commitment, signature, opponentAddress)) {
        return {
          channelState: state,
          displayOutbox: hideWallet(),
          messageOutbox: concludeFailure('Other', 'The signature provided is not valid.'),
        };
      }
      if (!validTransition(state, commitment)) {
        return {
          channelState: state,
          displayOutbox: hideWallet(),
          messageOutbox: concludeFailure(
            'Other',
            `The transition from ${state.type} to conclude is not valid.`,
          ),
        };
      }
      return {
        channelState: states.approveCloseOnChain({
          ...state,
          turnNum: commitment.turnNum,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment, signature },
        }),
        messageOutbox: concludeSuccess(),
      };
    default:
      return { channelState: state };
  }
};

const acknowledgeCloseSuccessReducer = (
  state: states.AcknowledgeCloseSuccess,
  action: WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.CLOSE_SUCCESS_ACKNOWLEDGED:
      return {
        channelState: states.waitForChannel({
          ...state,
        }),
        messageOutbox: closeSuccess(),
        displayOutbox: hideWallet(),
      };
    default:
      return { channelState: state };
  }
};

const acknowledgeClosedOnChainReducer = (
  state: states.AcknowledgeClosedOnChain,
  action: WalletAction,
): NextChannelState<states.ChannelState> => {
  switch (action.type) {
    case actions.CLOSED_ON_CHAIN_ACKNOWLEDGED:
      return { channelState: states.waitForChannel({ ...state }), messageOutbox: closeSuccess() };
    default:
      return { channelState: state };
  }
};

const composeConcludePosition = (state: states.ClosingState) => {
  const commitmentCount =
    state.lastCommitment.commitment.commitmentType === CommitmentType.Conclude ? 1 : 0;
  const concludeCommitment: Commitment = {
    ...state.lastCommitment.commitment,
    commitmentType: CommitmentType.Conclude,
    turnNum: state.turnNum + 1,
    commitmentCount,
  };

  const commitmentSignature = signCommitment(concludeCommitment, state.privateKey);
  const sendCommitmentAction = commitmentRelayRequested(
    state.participants[1 - state.ourIndex],
    concludeCommitment,
    commitmentSignature,
  );
  return { concludeCommitment, positionSignature: commitmentSignature, sendCommitmentAction };
};
