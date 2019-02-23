import * as states from '../../states';
import * as actions from '../actions';
import { messageRequest, fundingSuccess, fundingFailure, showWallet, hideWallet } from 'magmo-wallet-client/lib/wallet-events';

import { unreachable, validTransition } from '../../utils/reducer-utils';
import { createDepositTransaction } from '../../utils/transaction-generator';
import { signCommitment, validCommitmentSignature } from '../../utils/signing-utils';

import { Channel, Commitment, CommitmentType, } from 'fmg-core';
import { handleSignatureAndValidationMessages } from '../../utils/state-utils';
import { fromHex, toHex } from 'fmg-core';
import { bigNumberify } from 'ethers/utils';



export const fundingReducer = (state: states.FundingState, action: actions.WalletAction): states.WalletState => {
  // Handle any signature/validation request centrally to avoid duplicating code for each state
  if (action.type === actions.OWN_COMMITMENT_RECEIVED || action.type === actions.OPPONENT_COMMITMENT_RECEIVED) {
    return { ...state, messageOutbox: handleSignatureAndValidationMessages(state, action) };
  }
  switch (state.type) {
    case states.WAIT_FOR_FUNDING_REQUEST:
      return waitForFundingRequestReducer(state, action);
    case states.APPROVE_FUNDING:
      return approveFundingReducer(state, action);
    case states.WAIT_FOR_DEPOSIT_EVENTS:
      return waitForDepositEventsReducer(state, action);
    case states.A_WAIT_FOR_POST_FUND_SETUP:
      return aWaitForPostFundSetupReducer(state, action);
    case states.WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK:
      return waitForDepositToBeSentToMetaMaskReducer(state, action);
    case states.SUBMIT_DEPOSIT_IN_METAMASK:
      return submitDepositInMetaMaskReducer(state, action);
    case states.WAIT_FOR_DEPOSIT_CONFIRMATION:
      return waitForDepositConfirmationReducer(state, action);
    case states.B_WAIT_FOR_POST_FUND_SETUP:
      return bWaitForPostFundSetupReducer(state, action);
    case states.ACKNOWLEDGE_FUNDING_SUCCESS:
      return acknowledgeFundingSuccessReducer(state, action);
    case states.SEND_FUNDING_DECLINED_MESSAGE:
      return sendFundingDeclinedMessageReducer(state, action);
    case states.ACKNOWLEDGE_FUNDING_DECLINED:
      return acknowledgeFundingDeclinedReducer(state, action);
    case states.DEPOSIT_TRANSACTION_FAILED:
      return depositTransactionFailedReducer(state, action);
    default:
      return unreachable(state);
  }
};


const depositTransactionFailedReducer = (state: states.DepositTransactionFailed, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const fundingAmount = getFundingAmount(state, state.ourIndex);
      return states.waitForDepositToBeSentToMetaMask({
        ...state,
        adjudicator: state.adjudicator,
        transactionOutbox: createDepositTransaction(state.adjudicator, state.channelId, fundingAmount),
      });
  }
  return state;
};

const acknowledgeFundingDeclinedReducer = (state: states.AcknowledgeFundingDeclined, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_DECLINED_ACKNOWLEDGED:
      return states.waitForChannel({
        ...state,
        messageOutbox: fundingFailure(state.channelId, 'FundingDeclined'),
        displayOutbox: hideWallet(),
      });
  }
  return state;
};

const sendFundingDeclinedMessageReducer = (state: states.SendFundingDeclinedMessage, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_SENT:
      return states.waitForChannel({
        ...state,
        messageOutbox: fundingFailure(state.channelId, 'FundingDeclined'),
        displayOutbox: hideWallet(),
      });
      break;
  }
  return state;
};

const waitForFundingRequestReducer = (state: states.WaitForFundingRequest, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_REQUESTED:
      return states.approveFunding({ ...state, displayOutbox: showWallet() });
    default:
      return state;
  }
};

const approveFundingReducer = (state: states.ApproveFunding, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_APPROVED:

      const fundingAmount = getFundingAmount(state, state.ourIndex);
      return states.waitForDepositToBeSentToMetaMask({
        ...state,
        transactionOutbox: createDepositTransaction(state.adjudicator, state.channelId, fundingAmount),
      });

    case actions.FUNDING_REJECTED:
      const sendFundingDeclinedAction = messageRequest(state.participants[1 - state.ourIndex], 'FundingDeclined', "");
      return states.sendFundingDeclinedMessage({
        ...state,
        messageOutbox: sendFundingDeclinedAction,
        displayOutbox: hideWallet(),
      });
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      } else {
        if (state.ourIndex === 1) {
          return states.approveFunding({
            ...state,
            adjudicator: action.data,
          });
        } else {
          return state;
        }
      }
    default:
      return state;
  }
};

const waitForDepositEventsReducer = (state: states.WaitForDepositEvents, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      } else {
        return states.waitForDepositEvents({ ...state, unhandledAction: action });
      }
    case actions.FUNDING_RECEIVED_EVENT:
      const { allocation } = state.lastCommitment.commitment;
      const total = bigNumberify(allocation[0]).add(allocation[1]);
      if (bigNumberify(action.totalForDestination).lt(total)) {
        return state;
      }

      const { postFundSetupState, positionSignature, sendMessageAction } = composePostFundState(state);
      if (state.ourIndex === 0) {
        const updatedState = states.aWaitForPostFundSetup({
          ...state,
          turnNum: postFundSetupState.turnNum,
          penultimateState: state.lastCommitment,
          lastState: { state: postFundSetupState, signature: positionSignature },
          messageOutbox: sendMessageAction,
        });
        if (state.unhandledAction) {
          return fundingReducer(updatedState, state.unhandledAction);
        } else {
          return updatedState;
        }
      } else {
        const updatedState = states.bWaitForPostFundSetup(state);
        if (state.unhandledAction) {
          return fundingReducer(updatedState, state.unhandledAction);
        } else {
          return updatedState;
        }
      }
    default:
      return state;
  }
};

const aWaitForPostFundSetupReducer = (state: states.AWaitForPostFundSetup, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      const messageState = fromHex(action.data);
      if (!validTransitionToPostFundState(state, messageState, action.signature)) { return state; }

      const postFundState = fromHex(action.data);
      return states.acknowledgeFundingSuccess({
        ...state,
        turnNum: postFundState.turnNum,
        lastState: { state: messageState, signature: action.signature! },
        penultimateState: state.lastCommitment,
      });
    default:
      return state;
  }
};



const waitForDepositToBeSentToMetaMaskReducer = (state: states.WaitForDepositToBeSentToMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return states.submitDepositInMetaMask({
        ...state,
        unhandledAction: action,
      });

    case actions.TRANSACTION_SENT_TO_METAMASK:
      return states.submitDepositInMetaMask(state);
    default:
      return state;
  }
};

const submitDepositInMetaMaskReducer = (state: states.SubmitDepositInMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return states.submitDepositInMetaMask({
        ...state,
        unhandledAction: action,
      });
    case actions.TRANSACTION_SUBMITTED:
      return states.waitForDepositConfirmation({ ...state, transactionHash: action.transactionHash });
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return states.depositTransactionFailed(state);
    default:
      return state;
  }
};

const waitForDepositConfirmationReducer = (state: states.WaitForDepositConfirmation, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return states.waitForDepositConfirmation({
        ...state,
        unhandledAction: action,
      });
    case actions.TRANSACTION_CONFIRMED:

      if (state.unhandledAction) {
        const updatedState = states.waitForDepositEvents({ ...state, unhandledAction: undefined });
        // Now that  we're in a correct state to handle the message
        // we recursively call the reducer to handle the message received action
        return fundingReducer(updatedState, state.unhandledAction);
      } else {
        return states.waitForDepositEvents(state);
      }

    default:
      return state;
  }
};

const bWaitForPostFundSetupReducer = (state: states.BWaitForPostFundSetup, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      const messageState = fromHex(action.data);
      if (!validTransitionToPostFundState(state, messageState, action.signature)) {
        return state;
      }

      const newState = { ...state, turnNum: messageState.turnNum };
      const { postFundSetupState, positionSignature, sendMessageAction } = composePostFundState(newState);
      return states.acknowledgeFundingSuccess({
        ...newState,
        turnNum: postFundSetupState.turnNum,
        lastState: { state: postFundSetupState, signature: positionSignature },
        penultimateState: { state: messageState, signature: action.signature! },
        messageOutbox: sendMessageAction,
      });
    default:
      return state;
  }
};

const acknowledgeFundingSuccessReducer = (state: states.AcknowledgeFundingSuccess, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_SUCCESS_ACKNOWLEDGED:
      return states.waitForUpdate({
        ...state,
        displayOutbox: hideWallet(),
        messageOutbox: fundingSuccess(state.channelId, toHex(state.lastCommitment.commitment)),
      });
    default:
      return state;
  }
};

const validTransitionToPostFundState = (state: states.FundingState, data: Commitment, signature: string | undefined) => {
  if (!signature) { return false; }

  const opponentAddress = state.participants[1 - state.ourIndex];

  if (!validCommitmentSignature(data, signature, opponentAddress)) { return false; }
  // check transition
  if (!validTransition(state, data)) { return false; }
  if (data.commitmentType !== 1) { return false; }
  return true;
};

const composePostFundState = (state: states.WaitForDepositEvents | states.BWaitForPostFundSetup) => {
  const { libraryAddress, channelNonce, participants, turnNum, lastCommitment } = state;
  const channel: Channel = { channelType: libraryAddress, channelNonce, participants };

  const postFundSetupState: Commitment = {
    channel,
    commitmentType: CommitmentType.PostFundSetup,
    turnNum: turnNum + 1,
    commitmentCount: state.ourIndex,
    allocation: lastCommitment.commitment.allocation,
    destination: lastCommitment.commitment.destination,
    appAttributes: state.lastCommitment.commitment.appAttributes,
  };
  const stateSignature = signCommitment(postFundSetupState, state.privateKey);

  const sendMessageAction = messageRequest(state.participants[1 - state.ourIndex], toHex(postFundSetupState), stateSignature);
  return { postFundSetupState, positionSignature: stateSignature, sendMessageAction };
};

const getFundingAmount = (state: states.FundingState, index: number): string => {
  const lastState = state.lastCommitment.commitment;
  return "0x" + lastState.allocation[index];
};
