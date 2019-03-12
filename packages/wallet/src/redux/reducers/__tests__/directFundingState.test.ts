import { directFundingStateReducer } from '../channels/funding/directFundingState';

import * as states from '../../states/channels/funding/directFunding';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import { itTransitionsToStateType, itSendsThisTransaction } from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import { bigNumberify } from 'ethers/utils';
import { DIRECT_FUNDING, SharedDirectFundingState } from '../../states/channels/shared';

const { channelId } = scenarios;

const TOTAL_REQUIRED = bigNumberify(1000000000000000).toHexString();
const YOUR_DEPOSIT_A = bigNumberify(100).toHexString();
const YOUR_DEPOSIT_B = bigNumberify(TOTAL_REQUIRED)
  .sub(bigNumberify(YOUR_DEPOSIT_A))
  .toHexString();
const ZERO = '0x00';

const defaultsForA: SharedDirectFundingState = {
  fundingType: DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourDeposit: YOUR_DEPOSIT_A,
};

const defaultsForB: SharedDirectFundingState = {
  ...defaultsForA,
  requestedYourDeposit: YOUR_DEPOSIT_B,
};

const tx = '1234';
const defaultsWithTx = { ...defaultsForA, transactionHash: tx };

describe('start in aWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: depositSentToMetamask', () => {
    // player A scenario
    const state = states.aWaitForDepositToBeSentToMetaMask(defaultsForA);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_SUBMIT_DEPOSIT_IN_METAMASK, updatedState.fundingState);
  });
});

describe('start in aSubmitDepositInMetaMask', () => {
  describe('incoming action: deposit submitted', () => {
    // player A scenario
    const state = states.aSubmitDepositInMetaMask(defaultsForA);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState.fundingState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player A scenario
    const state = states.aSubmitDepositInMetaMask(defaultsForA);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_DEPOSIT_TRANSACTION_FAILED, updatedState.fundingState);
  });
});

describe('start in AWaitForDepositConfirmation', () => {
  describe('incoming action: transaction confirmed', () => {
    // player A scenario
    const state = states.aWaitForDepositConfirmation(defaultsWithTx);
    const action = actions.transactionConfirmed(tx);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });
  describe.skip('incoming action: transaction confirmed, funding event already received', () => {
    // TODO: what is the point of this test case?
    // player A scenario
    const state = states.aWaitForDepositConfirmation(defaultsWithTx);
    const action = actions.transactionConfirmed('1234');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });
});

describe('start in AWaitForOpponentDeposit', () => {
  describe('incoming action: funding received event', () => {
    // player A scenario
    const state = states.aWaitForOpponentDeposit(defaultsForA);
    const action = actions.fundingReceivedEvent(channelId, YOUR_DEPOSIT_B, TOTAL_REQUIRED);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.FUNDING_CONFIRMED, updatedState.fundingState);
  });

  describe('incoming action: funding received event for different channel', () => {
    // player A scenario
    const state = states.aWaitForOpponentDeposit(defaultsForA);
    const action = actions.fundingReceivedEvent('0xf00', YOUR_DEPOSIT_B, TOTAL_REQUIRED);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });

  describe('incoming action: funding received event for correct channelwith too little funds', () => {
    // player A scenario
    const state = states.aWaitForOpponentDeposit(defaultsForA);
    const action = actions.fundingReceivedEvent('0xf00', YOUR_DEPOSIT_B, YOUR_DEPOSIT_B);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });
});

// B
describe('start in BWaitForOpponentDeposit', () => {
  describe('incoming action: funding received event', () => {
    // player B scenario
    const createDepositTxMock = jest.fn(() => tx);
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const state = states.bWaitForOpponentDeposit(defaultsForB);
    const action = actions.fundingReceivedEvent(channelId, YOUR_DEPOSIT_A, YOUR_DEPOSIT_A);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(
      states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
      updatedState.fundingState,
    );
    itSendsThisTransaction(updatedState, tx);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
    expect(createDepositTxMock.mock.calls[0][1]).toBe(defaultsForB.requestedYourDeposit);
  });

  describe('incoming action: funding received event, too little funds', () => {
    // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const state = states.bWaitForOpponentDeposit(defaultsForB);
    const action = actions.fundingReceivedEvent(channelId, ZERO, ZERO);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });
});

describe('start in BWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: transaction sent to metamask', () => {
    // player B scenario
    const state = states.bWaitForDepositToBeSentToMetaMask(defaultsForB);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_SUBMIT_DEPOSIT_IN_METAMASK, updatedState.fundingState);
  });
});

describe('start in BSubmitDepositInMetaMask', () => {
  describe('incoming action: transaction submitted', () => {
    // player B scenario
    const state = states.bSubmitDepositInMetaMask(defaultsForB);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState.fundingState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player B scenario
    const state = states.bSubmitDepositInMetaMask(defaultsForB);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_DEPOSIT_TRANSACTION_FAILED, updatedState.fundingState);
  });
});

describe('start in BWaitForDepositConfirmation', () => {
  describe('incoming action: deposit confirmed', () => {
    // player B scenario
    const state = states.bWaitForDepositConfirmation(defaultsWithTx);
    const action = actions.transactionConfirmed();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.FUNDING_CONFIRMED, updatedState.fundingState);
  });
});

describe('start in B DepositTransactionFailed', () => {
  describe('incoming action: retry transaction', () => {
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });
    const state = states.bDepositTransactionFailed(defaultsForB);
    const action = actions.retryTransaction();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(
      states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
      updatedState.fundingState,
    );
    expect(createDepositTxMock.mock.calls.length).toBe(1);
  });
});

describe('start in A DepositTransactionFailure', () => {
  describe('incoming action: retry transaction', () => {
    const createDeployTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDeployTxMock,
    });
    const state = states.aDepositTransactionFailed(defaultsForA);
    const action = actions.retryTransaction();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(
      states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
      updatedState.fundingState,
    );
    expect(createDeployTxMock.mock.calls.length).toBe(1);
  });
});
