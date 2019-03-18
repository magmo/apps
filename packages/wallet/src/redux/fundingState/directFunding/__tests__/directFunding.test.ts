import { directFundingStateReducer } from '../reducer';

import * as states from '../state';
import * as depositingStates from '../depositing/state';
import * as actions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import {
  itSendsThisTransaction,
  itChangesChannelFundingStatusTo,
  itSendsNoTransaction,
  itChangesDepositStatusTo,
  itDispatchesThisAction,
  itDispatchesNoAction,
} from '../../../__tests__/helpers';
import * as TransactionGenerator from '../../../../utils/transaction-generator';
import { bigNumberify } from 'ethers/utils';

const { channelId } = scenarios;

const TOTAL_REQUIRED = bigNumberify(1000000000000000).toHexString();
const YOUR_DEPOSIT_A = bigNumberify(100).toHexString();
const YOUR_DEPOSIT_B = bigNumberify(TOTAL_REQUIRED)
  .sub(bigNumberify(YOUR_DEPOSIT_A))
  .toHexString();

const defaultsForA: states.DirectFundingState = {
  fundingType: states.DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  safeToDepositLevel: '0x',
  channelFundingStatus: states.WAIT_FOR_FUNDING_APPROVAL,
};

const defaultsForB: states.DirectFundingState = {
  ...defaultsForA,
  requestedYourContribution: YOUR_DEPOSIT_B,
  ourIndex: 1,
  safeToDepositLevel: YOUR_DEPOSIT_A,
};

const TX = 'TX';

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn('any state'), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe("When it's for the correct channel", () => {
      describe('when the channel is now funded', () => {
        const state = states.waitForFundingApproval(defaultsForA);
        const action = actions.fundingReceivedEvent(channelId, TOTAL_REQUIRED, TOTAL_REQUIRED);
        const updatedState = directFundingStateReducer(state, action);
        itChangesChannelFundingStatusTo(states.CHANNEL_FUNDED, updatedState);
        itDispatchesThisAction(actions.internal.DIRECT_FUNDING_CONFIRMED, updatedState);
      });
      describe('when the channel is still not funded', () => {
        const state = states.waitForFundingApproval(defaultsForA);
        const action = actions.fundingReceivedEvent(channelId, YOUR_DEPOSIT_B, YOUR_DEPOSIT_B);
        const updatedState = directFundingStateReducer(state, action);
        itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
        itDispatchesNoAction(updatedState);
      });
    });

    describe("When it's for another channels", () => {
      const state = states.waitForFundingApproval(defaultsForA);
      const action = actions.fundingReceivedEvent('0xf00', TOTAL_REQUIRED, TOTAL_REQUIRED);
      const updatedState = directFundingStateReducer(state, action);
      itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
      itDispatchesNoAction(updatedState);
    });
  });
});

describe(startingIn(states.WAIT_FOR_FUNDING_APPROVAL), () => {
  describe(whenActionArrives(actions.FUNDING_APPROVED), () => {
    // player A scenario
    const createDepositTxMock = jest.fn(() => TX);
    Object.defineProperty(TransactionGenerator, 'createDepositTransaction', {
      value: createDepositTxMock,
    });
    const state = states.waitForFundingApproval(defaultsForA);
    const action = actions.fundingApproved();
    const updatedState = directFundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, updatedState);
    itSendsThisTransaction(updatedState, TX);
  });

  describe(whenActionArrives(actions.FUNDING_APPROVED), () => {
    // player B scenario
    const state = states.waitForFundingApproval(defaultsForB);
    const action = actions.fundingApproved();
    const updatedState = directFundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, updatedState);
    itSendsNoTransaction(updatedState);
  });
});

describe(startingIn(states.NOT_SAFE_TO_DEPOSIT), () => {
  // player B scenario
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now safe to deposit', () => {
      const state = states.notSafeToDeposit(defaultsForB);
      const action = actions.fundingReceivedEvent(channelId, YOUR_DEPOSIT_A, YOUR_DEPOSIT_A);
      const updatedState = directFundingStateReducer(state, action);

      itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, updatedState);
      itChangesDepositStatusTo(depositingStates.WAIT_FOR_TRANSACTION_SENT, updatedState);
    });

    describe('when it is still not safe to deposit', () => {
      const state = states.notSafeToDeposit(defaultsForB);
      const action = actions.fundingReceivedEvent(channelId, '0x', '0x');
      const updatedState = directFundingStateReducer(state, action);

      itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, updatedState);
    });
  });
});

describe(startingIn(states.SAFE_TO_DEPOSIT), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now fully funded', () => {
      const state = states.waitForFundingConfirmed(defaultsForB);
      const action = actions.fundingReceivedEvent(channelId, YOUR_DEPOSIT_B, TOTAL_REQUIRED);
      const updatedState = directFundingStateReducer(state, action);

      itChangesChannelFundingStatusTo(states.CHANNEL_FUNDED, updatedState);
      itDispatchesThisAction(actions.internal.DIRECT_FUNDING_CONFIRMED, updatedState);
    });

    describe('when it is still not fully funded', () => {
      const state = states.waitForFundingConfirmed(defaultsForB);
      const action = actions.fundingReceivedEvent(channelId, '0x', YOUR_DEPOSIT_A);
      const updatedState = directFundingStateReducer(state, action);

      itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, updatedState);
      itDispatchesNoAction(updatedState);
      // itSendsNoMessage(updatedState);
    });

    describe('when it is for the wrong channel', () => {
      const state = states.waitForFundingConfirmed(defaultsForB);
      const action = actions.fundingReceivedEvent('0xf00', TOTAL_REQUIRED, TOTAL_REQUIRED);
      const updatedState = directFundingStateReducer(state, action);

      itChangesChannelFundingStatusTo(states.SAFE_TO_DEPOSIT, updatedState);
      itDispatchesNoAction(updatedState);
      // itSendsNoMessage(updatedState);
    });
  });
});

describe(startingIn(states.CHANNEL_FUNDED), () => {
  it.skip('works', () => {
    expect.assertions(1);
  });
});
