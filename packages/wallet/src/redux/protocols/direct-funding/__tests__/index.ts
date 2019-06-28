import {
  aHappyPath,
  aNoPostFundSetupHappyPath,
  bHappyPath,
  bNoPostFundSetupsHappyPath,
  transactionFails,
} from './scenarios';

export const preSuccessA = aHappyPath.waitForPostFundSetup;
export const noPostFundSetupsPreSuccessA = aNoPostFundSetupHappyPath.waitForFundingAndPostFundSetup;

export const preSuccessB = bHappyPath.waitForPostFundSetup;
export const noPostFundSetupsPreSuccessB =
  bNoPostFundSetupsHappyPath.waitForFundingAndPostFundSetup;
export const preFailure = transactionFails.waitForDepositTransaction;
