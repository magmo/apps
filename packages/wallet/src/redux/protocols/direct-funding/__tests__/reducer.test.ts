import { addHex } from '../../../../utils/hex-utils';
import * as actions from '../../../actions';
import { EMPTY_SHARED_DATA } from '../../../state';
import {
  itChangesChannelFundingStatusTo,
  itChangesTransactionSubmissionStatusTo,
} from '../../../__tests__/helpers';
import * as globalTestScenarios from '../../../__tests__/test-scenarios';
import { directFundingStateReducer } from '../reducer';
import * as states from '../state';
import * as scenarios from './scenarios';
import * as transactionSubmissionStates from '../../transaction-submission/states';

const { channelId, twoThree } = globalTestScenarios;

const YOUR_DEPOSIT_A = twoThree[1];
const YOUR_DEPOSIT_B = twoThree[0];
const TOTAL_REQUIRED = twoThree.reduce(addHex);

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn('any state'), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe("When it's for the correct channel", () => {
      describe('when the channel is now funded', () => {
        const state = scenarios.happyPathA.states.notSafeToDeposit;
        const action = actions.fundingReceivedEvent(
          channelId,
          channelId,
          TOTAL_REQUIRED,
          TOTAL_REQUIRED,
        );
        const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);
        itChangesChannelFundingStatusTo(states.CHANNEL_FUNDED, updatedState);
      });
      describe('when the channel is still not funded', () => {
        const state = scenarios.happyPathB.states.notSafeToDeposit;
        const action = actions.fundingReceivedEvent(
          channelId,
          channelId,
          YOUR_DEPOSIT_B,
          YOUR_DEPOSIT_B,
        );
        const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);
        itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, updatedState);
      });
    });

    describe("When it's for another channels", () => {
      const state = scenarios.happyPathA.states.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(
        channelId,
        '0xf00',
        TOTAL_REQUIRED,
        TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);
      itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, updatedState);
    });
  });
});

describe(startingIn(states.NOT_SAFE_TO_DEPOSIT), () => {
  // player B scenario
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now safe to deposit', () => {
      const state = scenarios.happyPathB.states.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(
        channelId,
        channelId,
        YOUR_DEPOSIT_A,
        YOUR_DEPOSIT_A,
      );
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);

      itChangesChannelFundingStatusTo(states.WAIT_FOR_DEPOSIT_TRANSACTION, updatedState);
      itChangesTransactionSubmissionStatusTo(
        transactionSubmissionStates.WAIT_FOR_SEND,
        updatedState as any,
      );
    });

    describe('when it is still not safe to deposit', () => {
      const state = scenarios.happyPathB.states.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(channelId, channelId, '0x', '0x');
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);

      itChangesChannelFundingStatusTo(states.NOT_SAFE_TO_DEPOSIT, updatedState);
    });
  });
});

describe(startingIn(states.WAIT_FOR_FUNDING_CONFIRMATION), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now fully funded', () => {
      const state = scenarios.happyPathB.states.waitForFundingConfirmation;
      const action = actions.fundingReceivedEvent(
        channelId,
        channelId,
        YOUR_DEPOSIT_B,
        TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);

      itChangesChannelFundingStatusTo(states.CHANNEL_FUNDED, updatedState);
    });

    describe('when it is still not fully funded', () => {
      const state = scenarios.happyPathB.states.waitForFundingConfirmation;
      const action = actions.fundingReceivedEvent(channelId, channelId, '0x', YOUR_DEPOSIT_A);
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);

      itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_CONFIRMATION, updatedState);
    });

    describe('when it is for the wrong channel', () => {
      const state = scenarios.happyPathB.states.waitForFundingConfirmation;
      const action = actions.fundingReceivedEvent(
        channelId,
        '0 xf00',
        TOTAL_REQUIRED,
        TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state, EMPTY_SHARED_DATA, action);

      itChangesChannelFundingStatusTo(states.WAIT_FOR_FUNDING_CONFIRMATION, updatedState);
    });
  });
});

describe(startingIn(states.CHANNEL_FUNDED), () => {
  it.skip('works', () => {
    expect.assertions(1);
  });
});
