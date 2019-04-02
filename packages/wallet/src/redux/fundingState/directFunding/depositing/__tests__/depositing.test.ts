import { depositingReducer } from '../reducer';

import * as states from '../state';
import * as directFundingStates from '../../state';
import * as actions from '../../../../actions';

import * as scenarios from '../../../../__tests__/test-scenarios';
import {
  itSendsThisTransaction,
  itChangesDepositStatusTo,
  itChangesChannelFundingStatusTo,
} from '../../../../__tests__/helpers';
import * as TransactionGenerator from '../../../../../utils/transaction-generator';
import { bigNumberify } from 'ethers/utils';
import { WalletProcedure } from '../../../../types';

const { channelId, mockTransactionOutboxItem } = scenarios;

const TOTAL_REQUIRED = bigNumberify(1000000000000000).toHexString();
const YOUR_DEPOSIT_A = bigNumberify(100).toHexString();
const YOUR_DEPOSIT_B = bigNumberify(TOTAL_REQUIRED)
  .sub(bigNumberify(YOUR_DEPOSIT_A))
  .toHexString();

const defaultsForA: states.Depositing = {
  fundingType: directFundingStates.DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  safeToDepositLevel: '0x',
  channelFundingStatus: directFundingStates.SAFE_TO_DEPOSIT,
  depositStatus: states.WAIT_FOR_TRANSACTION_SENT,
};

const defaultsForB: states.Depositing = {
  ...defaultsForA,
  requestedYourContribution: YOUR_DEPOSIT_B,
  ourIndex: 1,
  safeToDepositLevel: YOUR_DEPOSIT_A,
};

const TX_HASH = '0x0';
const defaultsWithTx = { ...defaultsForA, transactionHash: TX_HASH };

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn(states.WAIT_FOR_TRANSACTION_SENT), () => {
  describe(whenActionArrives(actions.TRANSACTION_SENT_TO_METAMASK), () => {
    // player A scenario
    const state = states.waitForTransactionSent(defaultsForA);
    const action = actions.transactionSentToMetamask(channelId, WalletProcedure.DirectFunding);
    const updatedState = depositingReducer(state, action);

    itChangesDepositStatusTo(states.WAIT_FOR_DEPOSIT_APPROVAL, updatedState);
  });
});

describe(startingIn(states.WAIT_FOR_DEPOSIT_APPROVAL), () => {
  describe(whenActionArrives(actions.TRANSACTION_SUBMITTED), () => {
    // player A scenario
    const state = states.waitForDepositApproval(defaultsForA);
    const action = actions.transactionSubmitted(channelId, WalletProcedure.DirectFunding, '0x0');
    const updatedState = depositingReducer(state, action);

    itChangesDepositStatusTo(states.WAIT_FOR_DEPOSIT_CONFIRMATION, updatedState);
  });

  describe(whenActionArrives(actions.TRANSACTION_SUBMISSION_FAILED), () => {
    // player A scenario
    const state = states.waitForDepositApproval(defaultsForA);
    const action = actions.transactionSubmissionFailed(channelId, WalletProcedure.DirectFunding, {
      code: '1234',
    });
    const updatedState = depositingReducer(state, action);

    itChangesDepositStatusTo(states.DEPOSIT_TRANSACTION_FAILED, updatedState);
  });
});

describe(startingIn(states.WAIT_FOR_DEPOSIT_CONFIRMATION), () => {
  describe(whenActionArrives(actions.TRANSACTION_CONFIRMED), () => {
    // player A scenario
    const state = states.waitForDepositConfirmation(defaultsWithTx);
    // TODO: This needs to change
    const action = actions.transactionConfirmed(TX_HASH, WalletProcedure.DirectFunding);
    const updatedState = depositingReducer(state, action);

    itChangesChannelFundingStatusTo(directFundingStates.SAFE_TO_DEPOSIT, updatedState);
  });
});

// B
describe(startingIn(states.DEPOSIT_TRANSACTION_FAILED), () => {
  describe(whenActionArrives(actions.TRANSACTION_SENT_TO_METAMASK), () => {
    // player B scenario
    const createDepositTxMock = jest.fn(() => mockTransactionOutboxItem.transactionRequest);
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });

    const state = states.depositTransactionFailed(defaultsForB);
    const action = actions.retryTransaction(channelId, WalletProcedure.DirectFunding);
    const updatedState = depositingReducer(state, action);

    itChangesDepositStatusTo(states.WAIT_FOR_TRANSACTION_SENT, updatedState);
    itSendsThisTransaction(updatedState, mockTransactionOutboxItem);
  });
});
