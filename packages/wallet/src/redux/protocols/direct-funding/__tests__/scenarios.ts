import { addHex } from '../../../../utils/hex-utils';
import * as scenarios from '../../../__tests__/test-scenarios';
import * as states from '../state';
import * as transactionSubmissionScenarios from '../../transaction-submission/__tests__/scenarios';

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
  type: states.NOT_SAFE_TO_DEPOSIT,
};

const defaultsForB: states.DirectFundingState = {
  ...defaultsForA,
  requestedYourContribution: YOUR_DEPOSIT_B,
  ourIndex: 1,
  safeToDepositLevel: YOUR_DEPOSIT_A,
};

export const aDepositsBDepositsAHappyStates = {
  notSafeToDeposit: states.notSafeToDeposit(defaultsForA),
  waitForDepositTransactionStart: states.waitForDepositTransaction(
    defaultsForA,
    transactionSubmissionScenarios.happyPath.waitForSend,
  ),
  waitForDepositTransactionEnd: states.waitForDepositTransaction(
    defaultsForA,
    transactionSubmissionScenarios.happyPath.waitForConfirmation,
  ),
  waitForFundingConfirmation: states.waitForFundingConfirmationAndPostFundSetup(defaultsForA),
  channelFunded: states.fundingSuccess(defaultsForA),
};

export const aDepositsBDepositsBHappyStates = {
  notSafeToDeposit: states.notSafeToDeposit(defaultsForB),
  waitForDepositTransaction: states.waitForDepositTransaction(
    defaultsForB,
    transactionSubmissionScenarios.happyPath.waitForSend,
  ),
  waitForFundingConfirmation: states.waitForFundingConfirmationAndPostFundSetup(defaultsForB),
  channelFunded: states.fundingSuccess(defaultsForB),
};
