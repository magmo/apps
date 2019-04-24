import {
  aDepositsBDepositsAHappyStates,
  actions,
  aDepositsBDepositsBHappyStates,
} from './scenarios';

export const preSuccessStateA = aDepositsBDepositsAHappyStates.waitForPostFundSetup;
export const successTriggerA = actions.postFundSetup1;

export const preSuccessStateB = aDepositsBDepositsBHappyStates.waitForPostFundSetup;
export const successTriggerB = actions.postFundSetup0;
