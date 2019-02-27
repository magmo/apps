import { walletReducer } from '..';

import * as states from '../../../states';
import * as actions from '../../actions';

import * as scenarios from './test-scenarios';
import { itTransitionsToStateType, itIncreasesTurnNumBy, itDoesntTransition } from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import * as SigningUtil from '../../../utils/signing-utils';
import * as fmgCore from 'fmg-core';
import { bigNumberify } from 'ethers/utils';
import { WaitForDepositEvents, SubmitDepositInMetaMask, WaitForDepositConfirmation, AcknowledgeFundingSuccess } from '../../../states';
import { CommitmentType } from 'fmg-core/lib/commitment';

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
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
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
};

const justReceivedPostFundSetupB = {
  penultimateCommitment: { commitment: postFundCommitment1, signature: 'sig' },
  lastCommitment: { commitment: postFundCommitment2, signature: 'sig' },
  turnNum: 3,
};



describe('start in WaitForFundingRequest', () => {
  describe('action taken: funding requested', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.APPROVE_FUNDING, updatedState);
  });

  describe('action taken: funding requested', () => { // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForFundingRequest(testDefaults);
    const action = actions.fundingRequested();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.APPROVE_FUNDING, updatedState);
  });

});

describe('start in ApproveFunding', () => {
  describe('incoming action: funding approved', () => { // player A scenario
    const createDeployTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', { value: createDeployTxMock });
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingApproved();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDeployTxMock.mock.calls.length).toBe(1);
  });

  describe('incoming action: funding rejected', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingRejected();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.SEND_FUNDING_DECLINED_MESSAGE, updatedState);
  });




  describe('action taken: funding approved', () => { // player B scenario
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', { value: createDepositTxMock });
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.approveFunding(testDefaults);
    const action = actions.fundingApproved();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
  });
});


describe('start in SendFundingDeclinedMessage', () => {
  describe('incoming action: message sent', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.sendFundingDeclinedMessage(testDefaults);
    const action = actions.messageSent();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_CHANNEL, updatedState);
    expect((updatedState.messageOutbox as outgoing.MessageRequest).type).toEqual(outgoing.FUNDING_FAILURE);
  });
});


describe('start in WaitForOpponentDeposit', () => {
  describe('incoming action: Funding declined message received', () => {
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositEvents(testDefaults);
    const action = actions.messageReceived("FundingDeclined");
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.ACKNOWLEDGE_FUNDING_DECLINED, updatedState);
  });
  describe('incoming action: funding received event as player A', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositEvents(testDefaults);
    const action = actions.fundingReceivedEvent(bsAddress, '0x2', '0x02');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
    expect((updatedState.messageOutbox as outgoing.MessageRequest).type).toEqual(outgoing.MESSAGE_REQUEST);
  });

  describe('incoming action: post fund setup as player B', () => { // player A scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositEvents(testDefaults);
    const action = actions.messageReceived('0x0', 'sig');

    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });
    const fromHexMock = jest.fn().mockReturnValue(postFundCommitment2);
    Object.defineProperty(fmgCore, "fromHex", { value: fromHexMock });
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_EVENTS, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
    expect((updatedState as WaitForDepositEvents).unhandledAction).toEqual(action);
  });
  describe('incoming action: funding received event as player B', () => { // player A scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositEvents(testDefaults);
    const action = actions.fundingReceivedEvent(asAddress, '0x2', '0x02');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.B_WAIT_FOR_POST_FUND_SETUP, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
    expect(updatedState.messageOutbox).toBeUndefined();
  });
});

describe('start in AWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupA };
    const state = states.aWaitForPostFundSetup(testDefaults);
    const action = actions.messageReceived('0x0', 'sig');

    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });
    const fromHexMock = jest.fn().mockReturnValue(postFundCommitment2);
    Object.defineProperty(fmgCore, "fromHex", { value: fromHexMock });

    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(1, state, updatedState);
  });
});



describe('start in WaitForDepositToBeSentToMetaMask', () => {
  describe('incoming action: transaction sent to metamask', () => { // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositToBeSentToMetaMask(testDefaults);
    const action = actions.transactionSentToMetamask();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.SUBMIT_DEPOSIT_IN_METAMASK, updatedState);
  });
});

describe('start in SubmitDepositInMetaMask', () => {
  describe('incoming action: transaction submitted', () => { // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.submitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmitted('0x0');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe("incoming action: funding received event", () => {
    const testDefaults = {
      ...defaultsB,
      ...justReceivedPreFundSetupB,
    };
    const state = states.submitDepositInMetaMask(testDefaults);
    const action = actions.fundingReceivedEvent(asAddress, '0x1', '0x02');
    const updatedState = walletReducer(state, action);

    itDoesntTransition(state, updatedState);
    expect((updatedState as SubmitDepositInMetaMask).unhandledAction).toEqual(action);
  });

  describe('incoming action: transaction submission failed', () => { // player B scenario
    const testDefaults = { ...defaultsA, ...justReceivedPreFundSetupB };
    const state = states.submitDepositInMetaMask(testDefaults);
    const action = actions.transactionSubmissionFailed({ code: "1234" });
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.DEPOSIT_TRANSACTION_FAILED, updatedState);
  });
});


describe('start in WaitForDepositConfirmation', () => {
  describe('incoming action: deposit confirmed', () => { // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.waitForDepositConfirmation(testDefaults);
    const action = actions.transactionConfirmed();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_EVENTS, updatedState);
    itIncreasesTurnNumBy(0, state, updatedState);
  });
  describe("incoming action: funding received event", () => {
    const testDefaults = {
      ...defaultsB,
      ...justReceivedPreFundSetupB,
    };
    const state = states.waitForDepositConfirmation(testDefaults);
    const action = actions.fundingReceivedEvent(asAddress, '0x1', '0x01');
    const updatedState = walletReducer(state, action);

    itDoesntTransition(state, updatedState);
    expect((updatedState as WaitForDepositConfirmation).unhandledAction).toEqual(action);
  });
});
describe('incoming action: deposit confirmed, funding event already received for player B', () => { // player B scenario
  const testDefaults = {
    ...defaultsB,
    ...justReceivedPreFundSetupB,
    unhandledAction: actions.fundingReceivedEvent(channelId, '0x1', '0x02'),
  };
  const state = states.waitForDepositConfirmation(testDefaults);
  const action = actions.transactionConfirmed();
  const updatedState = walletReducer(state, action);

  itTransitionsToStateType(states.B_WAIT_FOR_POST_FUND_SETUP, updatedState);
  itIncreasesTurnNumBy(0, state, updatedState);
});
describe('incoming action: deposit confirmed, funding event already received for player A', () => { // player B scenario
  const testDefaults = {
    ...defaultsA,
    ...justReceivedPreFundSetupB,
    unhandledAction: actions.fundingReceivedEvent(channelId, '0x1', '0x02'),
  };
  const state = states.waitForDepositConfirmation(testDefaults);
  const action = actions.transactionConfirmed();
  const updatedState = walletReducer(state, action);
  it("sets the lastCommitment to the PostFundSetupA", () => {
    expect((updatedState as AcknowledgeFundingSuccess).lastCommitment.commitment.commitmentType).toEqual(CommitmentType.PostFundSetup);
    expect((updatedState as AcknowledgeFundingSuccess).lastCommitment.commitment.commitmentCount).toEqual(0);
  });
  it("sends a message request", () => {
    expect((updatedState.messageOutbox as outgoing.MessageRequest).type).toEqual(outgoing.MESSAGE_REQUEST);
  });
  itTransitionsToStateType(states.A_WAIT_FOR_POST_FUND_SETUP, updatedState);
  itIncreasesTurnNumBy(1, state, updatedState);
});


describe('start in depositTransactionFailed', () => {
  describe('incoming action: retry transaction', () => {
    const createDepositTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', { value: createDepositTxMock });
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.depositTransactionFailed(testDefaults);
    const action = actions.retryTransaction();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, updatedState);
    expect(createDepositTxMock.mock.calls.length).toBe(1);
  });
});


describe('start in BWaitForPostFundSetup', () => {
  describe('incoming action: message received', () => { // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPreFundSetupB };
    const state = states.bWaitForPostFundSetup(testDefaults);
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateMock });
    const fromHexMock = jest.fn().mockReturnValue(postFundCommitment1);
    Object.defineProperty(fmgCore, "fromHex", { value: fromHexMock });
    const action = actions.messageReceived('0x0', 'sig');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.ACKNOWLEDGE_FUNDING_SUCCESS, updatedState);
    itIncreasesTurnNumBy(2, state, updatedState);
    it("sets the lastCommitment to the PostFundSetupB", () => {
      expect((updatedState as AcknowledgeFundingSuccess).lastCommitment.commitment.commitmentType).toEqual(CommitmentType.PostFundSetup);
      expect((updatedState as AcknowledgeFundingSuccess).lastCommitment.commitment.commitmentCount).toEqual(1);
    });
    expect((updatedState.messageOutbox as outgoing.MessageRequest).type).toEqual(outgoing.MESSAGE_REQUEST);
  });
});

describe('start in AcknowledgeFundingSuccess', () => {
  describe('incoming action: FundingSuccessAcknowledged', () => { // player A scenario
    const testDefaults = { ...defaultsA, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_UPDATE, updatedState);
    it("sends PostFundSetupB", () => {
      expect((updatedState.messageOutbox as outgoing.FundingSuccess).commitment.commitmentType).toEqual(CommitmentType.PostFundSetup);
      expect((updatedState.messageOutbox as outgoing.FundingSuccess).commitment.commitmentCount).toEqual(1);
    });
  });

  describe('incoming action: FundingSuccessAcknowledged', () => { // player B scenario
    const testDefaults = { ...defaultsB, ...justReceivedPostFundSetupB };
    const state = states.acknowledgeFundingSuccess(testDefaults);
    const action = actions.fundingSuccessAcknowledged();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_UPDATE, updatedState);
    expect((updatedState.messageOutbox as outgoing.FundingSuccess).type).toEqual(outgoing.FUNDING_SUCCESS);
    it("sends PostFundSetupB", () => {
      expect((updatedState.messageOutbox as outgoing.FundingSuccess).commitment.commitmentType).toEqual(CommitmentType.PostFundSetup);
      expect((updatedState.messageOutbox as outgoing.FundingSuccess).commitment.commitmentCount).toEqual(1);
    });
  });
});
