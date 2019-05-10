import * as scenarios from './scenarios';
export const initialStore = scenarios.playerAHappyPath.initialParams.store;
export const preSuccessState = scenarios.playerAHappyPath.waitForLedgerUpdate.state;
export const successTrigger = scenarios.playerAHappyPath.waitForLedgerUpdate.action;
export const preFailureState = scenarios.playerAInvalidCommitment.waitForLedgerUpdate.state;
export const failureTrigger = scenarios.playerAInvalidCommitment.waitForLedgerUpdate.action;
