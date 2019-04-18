import { addHex } from '../../../../utils/hex-utils';
import * as scenarios from '../../../__tests__/test-scenarios';
import * as states from '../state';

const { channelId, twoThree } = scenarios;

const YOUR_DEPOSIT_A = twoThree[1];
const YOUR_DEPOSIT_B = twoThree[0];
const TOTAL_REQUIRED = twoThree.reduce(addHex);

const defaultsForA: states.DirectFundingState = {
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  safeToDepositLevel: '0x',
  channelFundingStatus: states.NOT_SAFE_TO_DEPOSIT,
};

const defaultsForB: states.DirectFundingState = {
  ...defaultsForA,
  requestedYourContribution: YOUR_DEPOSIT_B,
  ourIndex: 1,
  safeToDepositLevel: YOUR_DEPOSIT_A,
};

export const happyPathA = {
  states: {
    notSafeToDeposit: states.notSafeToDeposit(defaultsForA),
    // waitForDepositTransaction: states.waitForDepositTransaction(defaultsForA),
    waitForFundingConfirmation: states.waitForFundingConfirmation(defaultsForA),
    channelFunded: states.channelFunded(defaultsForA),
  },
};

export const happyPathB = {
  states: {
    notSafeToDeposit: states.notSafeToDeposit(defaultsForB),
    // waitForDepositTransaction: states.waitForDepositTransaction(defaultsForB),
    waitForFundingConfirmation: states.waitForFundingConfirmation(defaultsForB),
    channelFunded: states.channelFunded(defaultsForB),
  },
};
