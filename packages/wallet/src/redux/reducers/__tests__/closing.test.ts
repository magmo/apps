import { walletReducer } from '..';

import * as states from '../../../states';
import * as actions from '../../actions';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import * as scenarios from './test-scenarios';
import { itTransitionsToStateType, itDoesntTransition } from './helpers';

import * as SigningUtil from '../../../utils/signing-utils';
import * as fmgCore from 'fmg-core';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import { bigNumberify } from 'ethers/utils';

const {
  asAddress,
  asPrivateKey,
  channel,
  gameCommitment1,
  gameCommitment2,
  concludeCommitment1,
  concludeCommitment2,
  channelId,

} = scenarios;
const defaults = {
  adjudicator: 'adj-address',
  channelId,
  channelNonce: channel.channelNonce,
  libraryAddress: channel.channelType,
  networkId: 3,
  participants: channel.participants as [string, string],
  uid: 'uid',
  transactionHash: '0x0',
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
};

const defaultsA = {
  ...defaults,
  ourIndex: 0,
  address: asAddress,
  privateKey: asPrivateKey,
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
};


describe('start in AcknowledgeConclude', () => {

  describe('action taken: conclude approved', () => {

    const state = states.acknowledgeConclude({
      ...defaultsA,
      penultimateCommitment: { commitment: gameCommitment2, signature: 'sig' },
      lastCommitment: { commitment: concludeCommitment1, signature: 'sig' },
      turnNum: 9,
    });

    const action = actions.concludeApproved();
    describe(' where the adjudicator exists', () => {
      const updatedState = walletReducer(state, action);
      itTransitionsToStateType(states.APPROVE_CLOSE_ON_CHAIN, updatedState);
      expect((updatedState.messageOutbox!).type).toEqual(outgoing.MESSAGE_REQUEST);
    });
    describe(' where the adjudicator does not exist', () => {
      state.adjudicator = undefined;
      const updatedState = walletReducer(state, action);
      itTransitionsToStateType(states.ACKNOWLEDGE_CLOSE_SUCCESS, updatedState);
      expect((updatedState.messageOutbox!).type).toEqual(outgoing.CONCLUDE_SUCCESS);
    });
  });

});

describe('start in ApproveConclude', () => {
  describe('action taken: conclude rejected', () => {
    const state = states.approveConclude({
      ...defaultsA,
      penultimateCommitment: { commitment: gameCommitment1, signature: 'sig' },
      lastCommitment: { commitment: gameCommitment2, signature: 'sig' },
      turnNum: 1,
    });
    const action = actions.concludeRejected();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_UPDATE, updatedState);
  });

  describe('action taken: conclude approved', () => {
    const state = states.approveConclude({
      ...defaultsA,
      penultimateCommitment: { commitment: gameCommitment1, signature: 'sig' },
      lastCommitment: { commitment: gameCommitment2, signature: 'sig' },
      turnNum: 1,
    });

    const action = actions.concludeApproved();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_OPPONENT_CONCLUDE, updatedState);
  });

});

describe('start in WaitForOpponentConclude', () => {
  describe('action taken: messageReceived', () => {
    const state = states.waitForOpponentConclude({
      ...defaultsA,
      penultimateCommitment: { commitment: gameCommitment2, signature: 'sig' },
      lastCommitment: { commitment: concludeCommitment1, signature: 'sig' },
      turnNum: concludeCommitment1.turnNum,
    });
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateMock });
    const fromHexMock = jest.fn().mockReturnValue(concludeCommitment2);
    Object.defineProperty(fmgCore, "fromHex", { value: fromHexMock });

    const action = actions.messageReceived('0x0', '0x0');
    describe(' where the adjudicator exists', () => {
      const updatedState = walletReducer(state, action);
      itTransitionsToStateType(states.APPROVE_CLOSE_ON_CHAIN, updatedState);
      expect((updatedState.messageOutbox!).type).toEqual(outgoing.CONCLUDE_SUCCESS);
    });
    describe(' where the adjudicator does not exist', () => {
      state.adjudicator = undefined;
      const updatedState = walletReducer(state, action);
      itTransitionsToStateType(states.ACKNOWLEDGE_CLOSE_SUCCESS, updatedState);
      expect((updatedState.messageOutbox!).type).toEqual(outgoing.CONCLUDE_SUCCESS);
    });
  });
});

describe('start in ApproveCloseOnChain', () => {
  const state = states.approveCloseOnChain({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
    userAddress: '0x0',
  });
  describe('action taken: approve close on chain', () => {
    // TODO: Mock out Signature contructor so we don't have to pass a valid signature string in 
    const createConcludeTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createConcludeAndWithdrawTransaction', { value: createConcludeTxMock });
    const signVerMock = jest.fn();
    signVerMock.mockReturnValue('0x0');
    Object.defineProperty(SigningUtil, 'signVerificationData', { value: signVerMock });
    const action = actions.approveClose('0x0');
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CLOSE_INITIATION, updatedState);
    expect((updatedState.messageOutbox!).type).toEqual(outgoing.MESSAGE_REQUEST);
  });

  describe('action taken: game concluded event', () => {
    const action = actions.gameConcludedEvent();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.APPROVE_WITHDRAWAL, updatedState);
  });

  describe('action taken: opponent started close message', () => {
    const validateSignatureMock = jest.fn();
    validateSignatureMock.mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateSignatureMock });
    const action = actions.messageReceived('CloseStarted', '0x0');
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_OPPONENT_CLOSE, updatedState);
  });

  describe('action taken: opponent sends incorrect message', () => {
    const validateSignatureMock = jest.fn();
    validateSignatureMock.mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validSignature', { value: validateSignatureMock });
    const action = actions.messageReceived('WRONG MESSAGE', '0x0');
    const updatedState = walletReducer(state, action);
    itDoesntTransition(state, updatedState);
  });

});

describe('start in WaitForOpponentClose', () => {
  const state = states.waitForOpponentClose({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
  });
  describe('action take: game concluded event', () => {
    const action = actions.gameConcludedEvent();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.APPROVE_WITHDRAWAL, updatedState);
  });
});

describe('start in WaitForCloseInitiation', () => {
  const state = states.waitForCloseInitiation({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
    userAddress: '0x0',
  });
  describe('action taken: transaction sent to metamask', () => {

    const action = actions.transactionSentToMetamask();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CLOSE_SUBMISSION, updatedState);
  });
  describe('action taken: game concluded event', () => {
    const action = actions.gameConcludedEvent();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.APPROVE_WITHDRAWAL, updatedState);
  });
});

describe('start in WaitForCloseSubmission', () => {
  const state = states.waitForCloseSubmission({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
    userAddress: '0x0',
  });
  describe('action taken: transaction submitted', () => {

    const action = actions.transactionSubmitted('0x0');
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CLOSE_CONFIRMED, updatedState);
  });
  describe('action taken: transaction submitted', () => {

    const action = actions.transactionSubmissionFailed({ code: 0 });
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.CLOSE_TRANSACTION_FAILED, updatedState);
  });
});

describe('start in closeTransactionFailed', () => {
  const state = states.closeTransactionFailed({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
    userAddress: '0x0',
  });

  describe('action taken: retry transaction', () => {
    const createConcludeTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createConcludeAndWithdrawTransaction', { value: createConcludeTxMock });
    const signVerMock = jest.fn();
    signVerMock.mockReturnValue('0x0');
    Object.defineProperty(SigningUtil, 'signVerificationData', { value: signVerMock });
    const action = actions.retryTransaction();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CLOSE_SUBMISSION, updatedState);
    expect(createConcludeTxMock.mock.calls.length).toBe(1);
  });
});

describe('start in WaitForCloseConfirmed', () => {
  const state = states.waitForCloseConfirmed({
    ...defaultsA,
    penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
    lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
    turnNum: concludeCommitment2.turnNum,
  });
  describe('action taken: transaction confirmed', () => {

    const action = actions.transactionConfirmed();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.ACKNOWLEDGE_CLOSE_SUCCESS, updatedState);
  });
});

describe('start in AcknowledgCloseSuccess', () => {
  describe('action taken: close success acknowledged', () => {
    const state = states.acknowledgeCloseSuccess({
      ...defaultsA,
      penultimateCommitment: { commitment: concludeCommitment1, signature: 'sig' },
      lastCommitment: { commitment: concludeCommitment2, signature: 'sig' },
      turnNum: concludeCommitment2.turnNum,
    });

    const action = actions.closeSuccessAcknowledged();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CHANNEL, updatedState);
    expect((updatedState.messageOutbox!).type).toEqual(outgoing.CLOSE_SUCCESS);
  });
});
