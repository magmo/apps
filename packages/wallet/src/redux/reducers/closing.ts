import * as states from '../../states';
import * as actions from '../actions';

import { WalletState, ClosingState } from '../../states';
import { WalletAction } from '../actions';
import { unreachable, ourTurn, validTransition } from '../../utils/reducer-utils';
import { signCommitment, validSignature, signVerificationData } from '../../utils/signing-utils';
import { messageRequest, closeSuccess, concludeSuccess, concludeFailure, hideWallet } from 'magmo-wallet-client/lib/wallet-events';
import { fromHex, toHex, CommitmentType, Commitment } from 'fmg-core';
import { createConcludeAndWithdrawTransaction, ConcludeAndWithdrawArgs } from '../../utils/transaction-generator';


export const closingReducer = (state: ClosingState, action: WalletAction): WalletState => {
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

const closeTransactionFailedReducer = (state: states.CloseTransactionFailed, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const { penultimateCommitment: from, lastCommitment: to } = state;
      const myAddress = state.participants[state.ourIndex];
      const amount = to.commitment.allocation[state.ourIndex];
      // TODO: The sender could of changed since the transaction failed. We'll need to check for the updated address.
      const verificationSignature = signVerificationData(myAddress, state.userAddress, amount, state.userAddress, state.privateKey);
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
      const transactionOutbox = createConcludeAndWithdrawTransaction(state.adjudicator, args);
      return states.waitForCloseSubmission({ ...state, transactionOutbox });
  }
  return state;
};

const acknowledgeConcludeReducer = (state: states.AcknowledgeConclude, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.CONCLUDE_APPROVED:
      if (!ourTurn(state)) { return { ...state, displayOutbox: hideWallet(), messageOutbox: concludeFailure('Other', 'It is not the current user\'s turn') }; }
      const { positionSignature, sendMessageAction, concludeCommitment } = composeConcludePosition(state);
      const lastState = state.lastCommitment.commitment;
      if (lastState.commitmentType === CommitmentType.Conclude) {
        if (state.adjudicator) {
          return states.approveCloseOnChain({
            ...state,
            adjudicator: state.adjudicator,
            turnNum: concludeCommitment.turnNum,
            penultimateCommitment: state.lastCommitment,
            lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
            messageOutbox: sendMessageAction,
          });
        } else {
          return states.acknowledgeCloseSuccess({
            ...state,
            messageOutbox: concludeSuccess(),
          });
        }
      }
  }
  return state;
};


const waitForCloseConfirmedReducer = (state: states.WaitForCloseConfirmed, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.TRANSACTION_CONFIRMED:
      // return states.waitForChannel({ ...state, messageOutbox: closeSuccess(), displayOutbox: hideWallet() });
      return states.acknowledgeCloseSuccess({ ...state, messageOutbox: closeSuccess() });
  }
  return state;
};

const waitForCloseInitiatorReducer = (state: states.WaitForCloseInitiation, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return states.waitForCloseSubmission(state);
  }
  return state;
};

const waitForCloseSubmissionReducer = (state: states.WaitForCloseSubmission, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return states.closeTransactionFailed(state);
    case actions.TRANSACTION_SUBMITTED:
      return states.waitForCloseConfirmed({ ...state, transactionHash: action.transactionHash });
  }
  return state;
};

const approveCloseOnChainReducer = (state: states.ApproveCloseOnChain, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.APPROVE_CLOSE:

      const { penultimateCommitment: from, lastCommitment: to } = state;
      const myAddress = state.participants[state.ourIndex];
      const amount = to.commitment.allocation[state.ourIndex];
      // TODO: The sender could of changed since the transaction failed. We'll need to check for the updated address.
      const verificationSignature = signVerificationData(myAddress, action.withdrawAddress, amount, action.withdrawAddress, state.privateKey);
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
      console.log(args);
      const transactionOutbox = createConcludeAndWithdrawTransaction(state.adjudicator, args);
      return states.waitForCloseInitiation({ ...state, userAddress: action.withdrawAddress, transactionOutbox });

      break;
    case actions.CONCLUDED_EVENT:
      return states.approveWithdrawal(state);
  }
  return state;
};

const approveConcludeReducer = (state: states.ApproveConclude, action: WalletAction) => {
  switch (action.type) {
    case actions.CONCLUDE_APPROVED:
      if (!ourTurn(state)) { return { ...state, displayOutbox: hideWallet(), messageOutbox: concludeFailure('Other', 'It is not the current user\'s turn') }; }

      const { concludeCommitment, positionSignature, sendMessageAction } = composeConcludePosition(state);
      const { lastCommitment } = state;
      if (lastCommitment.commitment.commitmentType === CommitmentType.Conclude) {
        return states.approveCloseOnChain({
          ...state,
          adjudicator: state.adjudicator,
          turnNum: concludeCommitment.turnNum,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
          messageOutbox: sendMessageAction,
        });

      } else {
        return states.waitForOpponentConclude({
          ...state,
          turnNum: concludeCommitment.turnNum,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment: concludeCommitment, signature: positionSignature },
          messageOutbox: sendMessageAction,
        });
      }
      break;
    case actions.CONCLUDE_REJECTED:
      return states.waitForUpdate({ ...state, adjudicator: state.adjudicator, displayOutbox: hideWallet(), messageOutbox: concludeFailure('UserDeclined') });
    default:
      return state;
  }
};

const waitForOpponentConclude = (state: states.WaitForOpponentConclude, action: WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:

      if (!action.signature) { return { ...state, displayOutbox: hideWallet(), messageOutbox: concludeFailure('Other', 'Signature is missing from the message.') }; }

      const opponentAddress = state.participants[1 - state.ourIndex];
      if (!validSignature(action.data, action.signature, opponentAddress)) {

        return { ...state, displayOutbox: hideWallet(), messageOutbox: concludeFailure('Other', 'The signature provided is not valid.') };
      }
      const concludeCommitment = fromHex(action.data);
      // check transition
      if (!validTransition(state, concludeCommitment)) {
        return { ...state, displayOutbox: hideWallet(), messageOutbox: concludeFailure('Other', `The transition from ${state.type} to conclude is not valid.`) };
      }
      if (state.adjudicator !== undefined) {
        return states.approveCloseOnChain({
          ...state,
          adjudicator: state.adjudicator,
          turnNum: concludeCommitment.turnNum,
          penultimateCommitment: state.lastCommitment,
          lastCommitment: { commitment: concludeCommitment, signature: action.signature },
          messageOutbox: concludeSuccess(),
        });
      } else {
        return states.acknowledgeCloseSuccess({
          ...state,
          messageOutbox: concludeSuccess(),
        });
      }

    default:
      return state;
  }
};



const acknowledgeCloseSuccessReducer = (state: states.AcknowledgeCloseSuccess, action: WalletAction) => {
  switch (action.type) {
    case actions.CLOSE_SUCCESS_ACKNOWLEDGED:
      return states.waitForChannel({
        ...state,
        messageOutbox: closeSuccess(),
        displayOutbox: hideWallet(),
      });
    default:
      return state;
  }
};

const acknowledgeClosedOnChainReducer = (state: states.AcknowledgeClosedOnChain, action: WalletAction) => {
  switch (action.type) {
    case actions.CLOSED_ON_CHAIN_ACKNOWLEDGED:
      return states.waitForChannel({
        ...state,
        messageOutbox: closeSuccess(),
      });
    default:
      return state;
  }
};

const composeConcludePosition = (state: states.ClosingState) => {
  const commitmentCount = state.lastCommitment.commitment.commitmentType === CommitmentType.Conclude ? 1 : 0;
  const concludeCommitment: Commitment = {
    ...state.lastCommitment.commitment,
    commitmentType: CommitmentType.Conclude,
    turnNum: state.turnNum + 1,
    commitmentCount,
  };

  const commitmentSignature = signCommitment(concludeCommitment, state.privateKey);
  const sendMessageAction = messageRequest(state.participants[1 - state.ourIndex], toHex(concludeCommitment), commitmentSignature);
  return { concludeCommitment, positionSignature: commitmentSignature, sendMessageAction };
};
