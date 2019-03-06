import { walletReducer } from '..';
import * as scenarios from './test-scenarios';
import * as states from '../.././states';
import * as actions from '../../actions';
import { itSendsATransaction, itTransitionsToStateType, itDoesntTransition } from './helpers';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import { hideWallet, challengeComplete } from 'magmo-wallet-client';
import { bigNumberify } from 'ethers/utils';


const {
  asPrivateKey,
  participants,
  channelId,
  channelNonce,
  libraryAddress,
  gameCommitment1,
  gameCommitment2,
} = scenarios;

const defaults = {
  uid: 'uid',
  participants,
  libraryAddress,
  channelId,
  channelNonce,
  lastCommitment: { commitment: gameCommitment1, signature: 'sig' },
  penultimateCommitment: { commitment: gameCommitment2, signature: 'sig' },
  turnNum: gameCommitment2.turnNum,
  adjudicator: 'adj-address',
  ourIndex: 0,
  address: 'address',
  privateKey: asPrivateKey,
  networkId: 2323,
  challengeExpiry: 1,
  transactionHash: '0x0',
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
};

describe('when in APPROVE_CHALLENGE', () => {
  const state = states.approveChallenge({ ...defaults });
  describe('when a challenge is approved', () => {
    const createChallengeTxMock = jest.fn().mockReturnValue('0x0');
    Object.defineProperty(TransactionGenerator, 'createForceMoveTransaction', { value: createChallengeTxMock });
    const action = actions.challengeApproved();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CHALLENGE_INITIATION, updatedState);
    itSendsATransaction(updatedState);
  });

  describe('when a challenge is declined', () => {
    const action = actions.challengeRejected();
    const updatedState = walletReducer(state, action);
    expect(updatedState.displayOutbox).toEqual(hideWallet());
    expect(updatedState.messageOutbox).toEqual(challengeComplete());
    itTransitionsToStateType(states.WAIT_FOR_UPDATE, updatedState);
  });
});

describe('when in INITIATE_CHALLENGE', () => {
  const transaction = {};
  const state = states.waitForChallengeInitiation(transaction, defaults);

  describe('when a challenge is initiated', () => {
    const action = actions.transactionSentToMetamask();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_CHALLENGE_SUBMISSION, updatedState);
  });
});

describe('when in WAIT_FOR_CHALLENGE_SUBMISSION', () => {
  const state = states.waitForChallengeSubmission(defaults);

  describe('when a challenge is submitted', () => {
    const action = actions.transactionSubmitted('0x0');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_CHALLENGE_CONFIRMATION, updatedState);
  });

  describe('when a challenge submissions fails', () => {
    const action = actions.transactionSubmissionFailed({ code: 0 });
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.CHALLENGE_TRANSACTION_FAILED, updatedState);
  });
});

describe('when in CHALLENGE_TRANSACTION_FAILED', () => {
  const state = states.challengeTransactionFailed(defaults);
  describe('when the transaction is retried', () => {
    const createChallengeTxMock = jest.fn();
    Object.defineProperty(TransactionGenerator, 'createForceMoveTransaction', { value: createChallengeTxMock });
    const action = actions.retryTransaction();
    const updatedState = walletReducer(state, action);
    itTransitionsToStateType(states.WAIT_FOR_CHALLENGE_INITIATION, updatedState);
    expect(createChallengeTxMock.mock.calls.length).toBe(1);

  });

});

describe('when in WAIT_FOR_CHALLENGE_CONFIRMATION', () => {
  const state = states.waitForChallengeConfirmation({ ...defaults });

  describe('when a challenge is confirmed', () => {
    const action = actions.transactionConfirmed();
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.WAIT_FOR_RESPONSE_OR_TIMEOUT, updatedState);
  });
});

describe('when in WAIT_FOR_RESPONSE_OR_TIMEOUT', () => {
  const state = states.waitForResponseOrTimeout({ ...defaults, challengeExpiry: 1, moveSelected: false, });

  describe('when the opponent responds', () => {
    const action = actions.respondWithMoveEvent('0x0', '0xC1');
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.ACKNOWLEDGE_CHALLENGE_RESPONSE, updatedState);
  });

  describe('when the challenge times out', () => {
    const action = actions.blockMined({ timestamp: 2, number: 2 });
    const updatedState = walletReducer(state, action);

    itTransitionsToStateType(states.ACKNOWLEDGE_CHALLENGE_TIMEOUT, updatedState);
  });

  describe('when a block is mined but the challenge has not expired', () => {
    const action = actions.blockMined({ number: 1, timestamp: 0 });
    const updatedState = walletReducer(state, action);
    itDoesntTransition(state, updatedState);
  });
});

describe('when in ACKNOWLEDGE_RESPONSE', () => {
  const state = states.acknowledgeChallengeResponse({ ...defaults });
  const action = actions.challengeResponseAcknowledged();
  const updatedState = walletReducer(state, action);

  itTransitionsToStateType(states.WAIT_FOR_UPDATE, updatedState);

});

describe('when in ACKNOWLEDGE_TIMEOUT', () => {
  const state = states.acknowledgeChallengeTimeout({ ...defaults });
  const action = actions.challengedTimedOutAcknowledged();
  const updatedState = walletReducer(state, action);

  itTransitionsToStateType(states.APPROVE_WITHDRAWAL, updatedState);

});
