import { fundingReducer } from '../channels/funding';

import * as states from '../../states/channels';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import {
  itTransitionsToChannelStateType,
  itIncreasesTurnNumBy,
  itSendsThisMessage,
  expectThisCommitmentSent,
  itTransitionsToStateType,
} from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import * as SigningUtil from '../../../utils/signing-utils';
import * as fmgCore from 'fmg-core';
import { bigNumberify } from 'ethers/utils';
import { NextChannelState } from 'src/redux/states/shared';
import { DIRECT_FUNDING } from 'src/redux/states/channels/funding/directFunding';

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
    fundingType: DIRECT_FUNDING,
    requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
    requestedYourContribution: bigNumberify(0).toHexString(),
  },
  funded: false,
};

const defaultsA = {
  ...defaults,
  ourIndex: 0,
  privateKey: asPrivateKey,
  requestedYourContribution: bigNumberify(500000000000000).toHexString(),
};

const defaultsB = {
  ...defaults,
  ourIndex: 1,
  privateKey: bsPrivateKey,
  requestedYourContribution: bigNumberify(500000000000000).toHexString(),
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

describe('start in WaitForFundingRequest', () => {
  describe('action taken: funding requested', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.APPROVE_FUNDING, updatedState);
    itTransitionsToStateType(states.APPROVE_FUNDING, updatedState.fundingState);
  });

  describe('action taken: funding requested', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.APPROVE_FUNDING, updatedState);
  });
});

describe('start in ApproveFunding', () => {
  describe('incoming action: funding approved', () => {
    // player A scenario
    const createDeployTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDeployTxMock,
    });
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingApproved();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDeployTxMock.mock.calls.length).toBe(1);
    // expect(createDeployTxMock.mock.calls[0][2]).toBe(state.lastCommitment.commitment.allocation[0]);
  });

  describe('incoming action: funding rejected', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingRejected();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.SEND_FUNDING_DECLINED_MESSAGE, updatedState);
  });

  describe('action taken: funding approved, funding received event not received', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingApproved();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_CONFIRMATION, updatedState);
  });

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
    const updatedState = fundingReducer(
      state,
      action,
      actions.fundingReceivedEvent(channelId, '0x2', '0x02'),
    );

    itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
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
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  });
  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositToBeSentToMetaMask(testDefaults);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
});

describe('start in aSubmitDepositInMetaMask', () => {
  describe('incoming action: deposit submitted', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_DEPOSIT_TRANSACTION_FAILED, updatedState);
  });

  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aSubmitDepositInMetaMask(testDefaults);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
});

describe('start in SendFundingDeclinedMessage', () => {
  describe('incoming action: message sent', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.sendFundingDeclinedMessage(testDefaults);
    const action = actions.messageSent();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_CHANNEL, updatedState);
    itSendsThisMessage(updatedState, outgoing.FUNDING_FAILURE);
  });
});

describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: transaction confirmed', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed('1234');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_OPPONENT_DEPOSIT, updatedState);
  });
  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositConfirmation(testDefaults);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
  describe('incoming action: transaction confirmed, funding event already received', () => {
    // player A scenario
    const unhandledAction = actions.fundingReceivedEvent(1000, bsAddress, '0x0a');
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed('1234');
    const updatedState = fundingReducer(state, action, unhandledAction);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AWaitForOpponentDeposit', () => {
  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForOpponentDeposit(testDefaults);
    const action = actions.messageReceived('FundingDeclined');
    const updatedState = fundingReducer(state, action);
    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
  describe('incoming action: funding received event', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.aWaitForOpponentDeposit(testDefaults);
    const action = actions.fundingReceivedEvent(1000, bsAddress, '0x0a');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => {
    // player A scenario
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupA };
    const state = states.aWaitForPostFundSetup(testDefaults);
    const action = actions.commitmentReceived(postFundCommitment2, 'sig');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
  });
});

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
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
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
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  });
});

describe('start in BSubmitDepositInMetaMask', () => {
  describe('incoming action: transaction submitted', () => {
    // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.bSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe('incoming action: transaction submission failed', () => {
    // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.bSubmitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmissionFailed({ code: '1234' });
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_DEPOSIT_TRANSACTION_FAILED, updatedState);
  });
});

describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: deposit confirmed', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
  });

  describe('incoming action: deposit confirmed, postFundA already received', () => {
    // player B scenario
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const testDefaults = {
      ...defaultsB,
      ...justReceivedPreFundSetupB,
    };
    const unhandledAction = actions.commitmentReceived(postFundCommitment1, '0x0');
    const state = states.bWaitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed();
    const updatedState = fundingReducer(state, action, unhandledAction);

    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(2, state, updatedState);
  });

  describe('incoming action: message received', () => {
    // player B scenario
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForDepositConfirmation(testDefaults);
    const action = actions.commitmentReceived(postFundCommitment2, '0x0');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
    it('works', async () => {
      expect(
        (updatedState as NextChannelState<states.BWaitForDepositConfirmation>).unhandledAction,
      ).toEqual(action);
    });
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
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
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
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDeployTxMock.mock.calls.length).toBe(1);
  });
});

describe('start in BWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForPostFundSetup(testDefaults);
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateMock });
    const action = actions.commitmentReceived(postFundCommitment1, 'sig');
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(2, state, updatedState);
    itSendsThisMessage(updatedState, outgoing.COMMITMENT_RELAY_REQUESTED);
  });
});

describe('start in AcknowledgeFundingSuccess', () => {
  describe('incoming action: FundingSuccessAcknowledged', () => {
    // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_UPDATE, updatedState);
    it('sends PostFundSetupB', () => {
      expectThisCommitmentSent(updatedState, {
        commitmentType: fmgCore.CommitmentType.PostFundSetup,
        commitmentCount: 1,
      });
    });
  });

  describe('incoming action: FundingSuccessAcknowledged', () => {
    // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = fundingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_UPDATE, updatedState);
    itSendsThisMessage(updatedState, outgoing.FUNDING_SUCCESS);
    it('sends PostFundSetupB', () => {
      expectThisCommitmentSent(updatedState, {
        commitmentType: fmgCore.CommitmentType.PostFundSetup,
        commitmentCount: 1,
      });
    });
  });
});
