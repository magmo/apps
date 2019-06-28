import { addHex } from '../../../../utils/hex-utils';
import * as globalActions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import * as advanceChannelScenarios from '../../advance-channel/__tests__';
import * as transactionSubmissionScenarios from '../../transaction-submission/__tests__';
import { directFundingRequested } from '../actions';
import * as states from '../states';

const { jointLedgerId: channelId, twoThree } = scenarios;

export const YOUR_DEPOSIT_A = twoThree[0];
export const YOUR_DEPOSIT_B = twoThree[1];
export const TOTAL_REQUIRED = twoThree.reduce(addHex);
const processId = `processId.${channelId}`;

// shared data

// Direct funding state machine states
const defaultsForA: states.DirectFundingState = {
  processId,
  totalFundingRequired: TOTAL_REQUIRED,
  requiredDeposit: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  safeToDepositLevel: '0x',
  type: 'DirectFunding.NotSafeToDeposit',
  exchangePostFundSetups: true,
  postFundSetupState: { ...advanceChannelScenarios.preSuccess.state, ourIndex: 0 },
};

const defaultsForB: states.DirectFundingState = {
  ...defaultsForA,
  requiredDeposit: YOUR_DEPOSIT_B,
  ourIndex: 1,
  safeToDepositLevel: YOUR_DEPOSIT_A,
  postFundSetupState: { ...advanceChannelScenarios.preSuccess.state, ourIndex: 1 },
};

// actions
const aInitializeAction = directFundingRequested({ ...defaultsForA });
const bInitializeAction = directFundingRequested({ ...defaultsForB });
const aFundingReceivedEvent = globalActions.fundingReceivedEvent({
  processId,
  channelId,
  amount: YOUR_DEPOSIT_A,
  totalForDestination: YOUR_DEPOSIT_A,
});
const bFundingReceivedEvent = globalActions.fundingReceivedEvent({
  processId,
  channelId,
  amount: YOUR_DEPOSIT_B,
  totalForDestination: TOTAL_REQUIRED,
});

const sharedData = () => ({ ...advanceChannelScenarios.preSuccess.sharedData });

export const aHappyPath = {
  initialize: { sharedData: sharedData(), action: aInitializeAction },
  waitForDepositTransaction: {
    state: states.waitForDepositTransaction({
      ...defaultsForA,
      transactionSubmissionState: transactionSubmissionScenarios.preSuccessState,
    }),
    sharedData: sharedData(),
    action: transactionSubmissionScenarios.successTrigger,
  },

  waitForFundingAndPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForA,
      channelFunded: false,
    }),
    sharedData: sharedData(),
    action: aFundingReceivedEvent,
  },
  waitForPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForA,
      channelFunded: true,
    }),
    sharedData: sharedData(),
    action: advanceChannelScenarios.preSuccess.trigger,
  },
};

export const aNoPostFundSetupHappyPath = {
  initialize: { sharedData: sharedData(), action: aInitializeAction },
  waitForDepositTransaction: {
    state: states.waitForDepositTransaction({
      ...defaultsForA,
      exchangePostFundSetups: false,
      transactionSubmissionState: transactionSubmissionScenarios.preSuccessState,
    }),
    sharedData: sharedData(),
    action: transactionSubmissionScenarios.successTrigger,
  },

  waitForFundingAndPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForA,
      channelFunded: false,
      postFundSetupReceived: false,
      exchangePostFundSetups: false,
    }),
    sharedData: sharedData(),
    action: bFundingReceivedEvent,
  },
};

export const bHappyPath = {
  initialize: { sharedData: sharedData(), action: bInitializeAction },
  notSafeToDeposit: {
    state: states.notSafeToDeposit(defaultsForB),
    action: aFundingReceivedEvent,
    sharedData: sharedData(),
  },
  waitForDepositTransaction: {
    state: states.waitForDepositTransaction({
      ...defaultsForB,
      transactionSubmissionState: transactionSubmissionScenarios.preSuccessState,
    }),
    sharedData: sharedData(),
    action: transactionSubmissionScenarios.successTrigger,
  },
  waitForFundingAndPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForB,
      channelFunded: false,
    }),
    sharedData: sharedData(),
    action: bFundingReceivedEvent,
  },
  waitForPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForB,
      channelFunded: true,
    }),
    sharedData: sharedData(),
    action: advanceChannelScenarios.preSuccess.trigger,
  },
};

export const bNoPostFundSetupsHappyPath = {
  initialize: { sharedData: sharedData(), action: bInitializeAction },
  notSafeToDeposit: {
    state: states.notSafeToDeposit({ ...defaultsForB, exchangePostFundSetups: false }),
    action: aFundingReceivedEvent,
    sharedData: sharedData(),
  },
  waitForDepositTransaction: {
    state: states.waitForDepositTransaction({
      ...defaultsForB,
      exchangePostFundSetups: false,
      transactionSubmissionState: transactionSubmissionScenarios.preSuccessState,
    }),
    sharedData: sharedData(),
    action: transactionSubmissionScenarios.successTrigger,
  },
  waitForFundingAndPostFundSetup: {
    state: states.waitForFundingAndPostFundSetup({
      ...defaultsForB,
      exchangePostFundSetups: false,
      channelFunded: false,
      postFundSetupReceived: false,
    }),
    sharedData: sharedData(),
    action: bFundingReceivedEvent,
  },
};

export const transactionFails = {
  waitForDepositTransaction: {
    state: states.waitForDepositTransaction({
      ...defaultsForA,
      transactionSubmissionState: transactionSubmissionScenarios.preFailureState,
    }),
    sharedData: sharedData(),

    action: transactionSubmissionScenarios.failureTrigger,
  },
};
