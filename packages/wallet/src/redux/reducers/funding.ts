import * as states from '../../states';
import * as actions from '../actions';
import { messageRequest, fundingSuccess, fundingFailure, showWallet, hideWallet } from 'magmo-wallet-client/lib/wallet-events';

import { unreachable, validTransition } from '../../utils/reducer-utils';
import { createDeployTransaction, createDepositTransaction } from '../../utils/transaction-generator';
import { signCommitment, validCommitmentSignature } from '../../utils/signing-utils';

import { Channel, State as Commitment, bigNumberify, } from 'fmg-core';
import { handleSignatureAndValidationMessages } from '../../utils/state-utils';
import { StateType, fromHex, toHex } from 'fmg-core';


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
    case states.A_WAIT_FOR_DEPLOY_TO_BE_SENT_TO_METAMASK:
      return aWaitForDeployToBeSentToMetaMaskReducer(state, action);
    case states.A_SUBMIT_DEPLOY_IN_METAMASK:
      return aSubmitDeployToMetaMaskReducer(state, action);
    case states.WAIT_FOR_DEPLOY_CONFIRMATION:
      return waitForDeployConfirmationReducer(state, action);
    case states.A_WAIT_FOR_DEPOSIT:
      return aWaitForDepositReducer(state, action);
    case states.A_WAIT_FOR_POST_FUND_SETUP:
      return aWaitForPostFundSetupReducer(state, action);
    case states.B_WAIT_FOR_DEPLOY_ADDRESS:
      return bWaitForDeployAddressReducer(state, action);
    case states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK:
      return bWaitForDepositToBeSentToMetaMaskReducer(state, action);
    case states.B_SUBMIT_DEPOSIT_IN_METAMASK:
      return bSubmitDepositInMetaMaskReducer(state, action);
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
    case states.DEPLOY_TRANSACTION_FAILED:
      return deployTransactionFailedReducer(state, action);
    case states.DEPOSIT_TRANSACTION_FAILED:
      return depositTransactionFailedReducer(state, action);
    default:
      return unreachable(state);
  }
};

const deployTransactionFailedReducer = (state: states.DeployTransactionFailed, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const fundingAmount = getFundingAmount(state, state.ourIndex);
      return states.aWaitForDeployToBeSentToMetaMask({
        ...state,
        transactionOutbox: createDeployTransaction(state.networkId, state.channelId, fundingAmount),
      });
  }
  return state;
};

const depositTransactionFailedReducer = (state: states.DepositTransactionFailed, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const fundingAmount = getFundingAmount(state, state.ourIndex);
      return states.bWaitForDepositToBeSentToMetaMask({
        ...state,
        adjudicator: state.adjudicator,
        transactionOutbox: createDepositTransaction(state.adjudicator, fundingAmount),
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
      if (state.ourIndex === 0) {
        const fundingAmount = getFundingAmount(state, state.ourIndex);
        return states.aWaitForDeployToBeSentToMetaMask({
          ...state,
          transactionOutbox: createDeployTransaction(state.networkId, state.channelId, fundingAmount),
        });
      } else {
        if (!state.adjudicator) {
          return states.bWaitForDeployAddress(state);
        }
        const fundingAmount = getFundingAmount(state, state.ourIndex);
        return states.bWaitForDepositToBeSentToMetaMask({
          ...state,
          adjudicator: state.adjudicator,
          transactionOutbox: createDepositTransaction(state.adjudicator, fundingAmount),
        });
      }
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

const aWaitForDeployToBeSentToMetaMaskReducer = (state: states.AWaitForDeployToBeSentToMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return states.aSubmitDeployInMetaMask(state);
    case actions.FUNDING_RECEIVED_EVENT:
      return states.aWaitForDeployToBeSentToMetaMask({ ...state, unhandledAdjudicatorEvent: action });
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      }
      break;
    default:
      return state;
  }
  return state;
};

const aSubmitDeployToMetaMaskReducer = (state: states.ASubmitDeployInMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      return states.aSubmitDeployInMetaMask({ ...state, unhandledAction: action });
    case actions.TRANSACTION_SUBMITTED:
      return states.waitForDeployConfirmation({ ...state, transactionHash: action.transactionHash });
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return states.deployTransactionFailed(state);
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      }
      break;
    default:
      return state;
  }
  return state;
};

const waitForDeployConfirmationReducer = (state: states.WaitForDeployConfirmation, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      }
      break;
    case actions.FUNDING_RECEIVED_EVENT:
      return states.aSubmitDeployInMetaMask({ ...state, unhandledAction: action });
    case actions.TRANSACTION_CONFIRMED:
      if (!action.contractAddress) { return state; }
      const sendAdjudicatorAddressAction = messageRequest(state.participants[1 - state.ourIndex], action.contractAddress, "");
      const updatedState = states.aWaitForDeposit({
        ...state,
        adjudicator: action.contractAddress,
        messageOutbox: sendAdjudicatorAddressAction,
      });
      if (state.unhandledAction) {
        // Now that  we're in a correct state to handle the funding received event 
        // we recursively call the reducer to handle the funding received event
        return fundingReducer({ ...updatedState, unhandledAction: undefined }, state.unhandledAction);
      }
      else {
        return updatedState;
      }
    default:
      return state;
  }
  return state;
};

const aWaitForDepositReducer = (state: states.AWaitForDeposit, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      if (action.data && action.data === 'FundingDeclined') {
        return states.acknowledgeFundingDeclined(state);
      }
      break;
    case actions.FUNDING_RECEIVED_EVENT:
      const { allocation } = state.lastCommitment.commitment;
      const totalFunds = allocation[state.ourIndex].add(allocation[1 - state.ourIndex]);
      const adjudicatorBalance = bigNumberify(action.adjudicatorBalance);
      if (!adjudicatorBalance.eq(totalFunds)) {
        return state;
      }

      const { postFundSetupState, positionSignature, sendMessageAction } = composePostFundState(state);
      return states.aWaitForPostFundSetup({
        ...state,
        turnNum: postFundSetupState.turnNum,
        penultimateState: state.lastCommitment,
        lastState: { state: postFundSetupState, signature: positionSignature },
        messageOutbox: sendMessageAction,
      });
    default:
      return state;
  }
  return state;
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

const bWaitForDeployAddressReducer = (state: states.BWaitForDeployAddress, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.MESSAGE_RECEIVED:
      const fundingAmount = getFundingAmount(state, state.ourIndex);
      return states.bWaitForDepositToBeSentToMetaMask({
        ...state,
        adjudicator: action.data,
        transactionOutbox: createDepositTransaction(action.data, fundingAmount),
      });
    default:
      return state;
  }
};

const bWaitForDepositToBeSentToMetaMaskReducer = (state: states.BWaitForDepositToBeSentToMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return states.bSubmitDepositInMetaMask(state);
    default:
      return state;
  }
};

const bSubmitDepositInMetaMaskReducer = (state: states.BSubmitDepositInMetaMask, action: actions.WalletAction) => {
  switch (action.type) {
    // This case should not happen in theory, but it does in practice.
    // B submits deposit transaction, transaction is confirmed, A sends postfundset, B receives postfundsetup
    // All of the above happens before B receives transaction submitted
    case actions.MESSAGE_RECEIVED:
      return states.bSubmitDepositInMetaMask({
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
    case actions.MESSAGE_RECEIVED:
      if (!action.signature) { return state; }
      return states.waitForDepositConfirmation({
        ...state,
        unhandledAction: action,
        transactionHash: state.transactionHash,
      });
    case actions.TRANSACTION_CONFIRMED:
      if (state.unhandledAction) {
        const updatedState = states.bWaitForPostFundSetup({ ...state, unhandledAction: undefined });
        // Now that  we're in a correct state to handle the message
        // we recursively call the reducer to handle the message received action
        return fundingReducer(updatedState, state.unhandledAction);
      } else {
        return states.bWaitForPostFundSetup(state);
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
  if (data.stateType !== 1) { return false; }
  return true;
};

const composePostFundState = (state: states.AWaitForDeposit | states.BWaitForPostFundSetup) => {
  const { libraryAddress, channelNonce, participants, turnNum, lastCommitment } = state;
  const channel = new Channel(libraryAddress, channelNonce, participants);

  const postFundSetupState: Commitment = {
    channel,
    stateType: StateType.PostFundSetup,
    turnNum: turnNum.add(1),
    stateCount: bigNumberify(state.ourIndex),
    allocation: lastCommitment.commitment.allocation,
    destination: lastCommitment.commitment.destination,
    gameAttributes: state.lastCommitment.commitment.gameAttributes,
  };
  const stateSignature = signCommitment(postFundSetupState, state.privateKey);

  const sendMessageAction = messageRequest(state.participants[1 - state.ourIndex], toHex(postFundSetupState), stateSignature);
  return { postFundSetupState, positionSignature: stateSignature, sendMessageAction };
};

const getFundingAmount = (state: states.FundingState, index: number): string => {
  const lastState = state.lastCommitment.commitment;
  return "0x" + lastState.allocation[index].toHexString();
};
