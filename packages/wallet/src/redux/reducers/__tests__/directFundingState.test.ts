import { directFundingStateReducer } from '../channels/funding/directFundingState';

import * as states from '../../states/channels/funding/directFunding';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import { itTransitionsToStateType, itIncreasesTurnNumBy, itSendsThisMessage } from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import { bigNumberify } from 'ethers/utils';

const {
  asAddress,
  asPrivateKey,
  bsPrivateKey,
  channelNonce,
  libraryAddress,
  participants,
  preFundCommitment1,
  preFundCommitment2,
  postFundCommitment1,
  postFundCommitment2,
  bsAddress,
  channelId,
} = scenarios;

const defaults = {
  address: asAddress,
  adjudicator: 'adj-address',
  channelId,
  channelNonce,
  libraryAddress,
  networkId: 3,
  participants,
  uid: 'uid',
  transactionHash: '0x0',
  fundingState: {
    requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
    requestedYourDeposit: bigNumberify(0).toHexString(),
  },
  funded: false,
};

const defaultsA = {
  ...defaults,
  ourIndex: 0,
  privateKey: asPrivateKey,
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
};

const defaultsB = {
  ...defaults,
  ourIndex: 1,
  privateKey: bsPrivateKey,
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
};

const justReceivedPreFundSetupB = {
  penultimateCommitment: { commitment: preFundCommitment1, signature: 'sig' },
  lastCommitment: { commitment: preFundCommitment2, signature: 'sig' },
  turnNum: 1,
};

const justReceivedPostFundSetupA = {
  penultimateCommitment: { commitment: preFundCommitment2, signature: 'sig' },
  lastCommitment: { commitment: postFundCommitment1, signature: 'sig' },
  turnNum: 2,
  funded: true,
};

const justReceivedPostFundSetupB = {
  penultimateCommitment: { commitment: postFundCommitment1, signature: 'sig' },
  lastCommitment: { commitment: postFundCommitment2, signature: 'sig' },
  turnNum: 3,
  funded: true,
};

describe('start in ApproveFunding', () => {
  describe('action taken: funding approved, funding received event already received', () => {
    // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.approveFunding({
      ...testDefaults,
    });
    const action = actions.fundingApproved();
    const updatedState = directFundingStateReducer(
      state,
      action,
      actions.fundingReceivedEvent(channelId, '0x2', '0x02'),
    );

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
    expect(createDepositTxMock.mock.calls[0][1]).toBe(
      state.lastCommitment.commitment.allocation[1],
    );
  });
});

describe('start in aWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: depositSentToMetamask', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositToBeSentToMetaMask(testDefaults);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  });
});

describe('start in aSubmitDepositInMetaMask', () => {
  describe('incoming action: deposit submitted', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_DEPOSIT_TRANSACTION_FAILED, updatedState);
  });
});

describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: transaction confirmed', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed('1234');
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState);
  });
  describe('incoming action: transaction confirmed, funding event already received', () => {
    // player A scenario
    const unhandledAction = actions.fundingReceivedEvent(1000, bsAddress, '0x0a');
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed('1234');
    const updatedState = directFundingStateReducer(state, action, unhandledAction);

    itTransitionsToStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AWaitForOpponentDeposit', () => {
  describe('incoming action: funding received event', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForOpponentDeposit(testDefaults);
    const action = actions.fundingReceivedEvent(1000, bsAddress, '0x0a');
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AWaitForPostFundSetup', () => {});

describe('start in BWaitForDeployAddress', () => {
  describe('incoming action: funding received event', () => {
    // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingConfirmation(testDefaults);
    const action = actions.fundingReceivedEvent(channelId, '0x2', '0x02');
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
    expect(createDepositTxMock.mock.calls[0][1]).toBe(
      state.lastCommitment.commitment.allocation[1],
    );
  });
});

describe('start in BWaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: transaction sent to metamask', () => {
    // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.bWaitForDepositToBeSentToMetaMask(testDefaults);
    const action = actions.transactionSentToMetamask();
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  });
});

describe('start in BSubmitDepositInMetaMask', () => {
  describe('incoming action: transaction submitted', () => {
    // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.bSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.bSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_DEPOSIT_TRANSACTION_FAILED, updatedState);
  });
});

describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: deposit confirmed', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed();
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
  });
});

describe('start in B DepositTransactionFailed', () => {
  describe('incoming action: retry transaction', () => {
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bDepositTransactionFailed(testDefaults);
    const action = actions.retryTransaction();
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
  });
});

describe('start in A DepositTransactionFailure', () => {
  describe('incoming action: retry transaction', () => {
    const createDeployTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDeployTxMock,
    });
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.aDepositTransactionFailed(testDefaults);
    const action = actions.retryTransaction();
    const updatedState = directFundingStateReducer(state, action);

    itTransitionsToStateType(states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDeployTxMock.mock.calls.length).toBe(1);
  });
});
