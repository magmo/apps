import { directFundingStateReducer } from '../channels/funding/directFundingState';

import * as states from '../../states/channels/funding/directFunding';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import { itTransitionsToStateType, itSendsThisMessage } from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import { bigNumberify } from 'ethers/utils';
import { DIRECT_FUNDING, SharedDirectFundingState } from '../../states/channels/shared';

const { bsAddress, channelId } = scenarios;

const defaults: SharedDirectFundingState = {
  fundingType: DIRECT_FUNDING,
  type: '',
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
  requestedYourDeposit: bigNumberify(0).toHexString(),
};

const tx = '1234';
const defaultsWithTx = { ...defaults, transactionHash: tx };

describe('start in aWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: depositSentToMetamask', () => {
    // player A scenario
    const state = states.aWaitForDepositToBeSentToMetaMask(defaults);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_SUBMIT_DEPOSIT_IN_METAMASK, updatedState.fundingState);
  });
});

describe('start in aSubmitDepositInMetaMask', () => {
  describe('incoming action: deposit submitted', () => {
    // player A scenario
    const state = states.aSubmitDepositInMetaMask(defaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState.fundingState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player A scenario
    const state = states.aSubmitDepositInMetaMask(defaults);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_DEPOSIT_TRANSACTION_FAILED, updatedState.fundingState);
  });
});

describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: transaction confirmed', () => {
    // player A scenario
    const state = states.aWaitForDepositConfirmation(defaultsWithTx);
    const action = actions.transactionConfirmed(tx);
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
  });
  describe('incoming action: transaction confirmed, funding event already received', () => {
    // player A scenario
    const state = states.aWaitForDepositConfirmation(defaultsWithTx);
    const action = actions.transactionConfirmed('1234');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState.fundingState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AWaitForOpponentDeposit', () => {
  describe('incoming action: funding received event', () => {
    // player A scenario
    const state = states.aWaitForOpponentDeposit(defaults);
    const action = actions.fundingReceivedEvent(1000, bsAddress, '0x0a');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.FUNDING_CONFIRMED, updatedState.fundingState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in BWaitForOpponentDeposit', () => {
  describe('incoming action: funding received event', () => {
    // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const state = states.bWaitForOpponentDeposit(defaults);
    const action = actions.fundingReceivedEvent(channelId, '0x2', '0x02');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(
      states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
      updatedState.fundingState,
    );
    expect(createDepositTxMock.mock.calls.length).toBe(1);
    expect(createDepositTxMock.mock.calls[0][1]).toBe(defaults.requestedYourDeposit);
  });
});

describe('start in BWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: transaction sent to metamask', () => {
    // player B scenario
    const state = states.bWaitForDepositToBeSentToMetaMask(defaults);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_SUBMIT_DEPOSIT_IN_METAMASK, updatedState.fundingState);
  });
});

describe('start in BSubmitDepositInMetaMask', () => {
  describe('incoming action: transaction submitted', () => {
    // player B scenario
    const state = states.bSubmitDepositInMetaMask(defaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState.fundingState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player B scenario
    const state = states.bSubmitDepositInMetaMask(defaults);
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
    const state = states.bDepositTransactionFailed(defaults);
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
    const state = states.aDepositTransactionFailed(defaults);
    const action = actions.retryTransaction();
    const updatedState = directFundingStateReducer(state, action, channelId);

    itTransitionsToStateType(
      states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
      updatedState.fundingState,
    );
    expect(createDeployTxMock.mock.calls.length).toBe(1);
  });
});
