import * as states from '../states';
import * as testScenarios from '../../../../domain/commitments/__tests__';

import * as actions from '../actions';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, asAddress: address, asPrivateKey: privateKey } = testScenarios;
import { ChannelState } from '../../../channel-store';
import { APPLICATION_PROCESS_ID } from '../reducer';
import {
  challengerPreSuccessOpenState,
  terminatingAction,
  challengerPreSuccessClosedState,
} from '../../dispute/challenger';

const signedState19 = testScenarios.appState({ turnNum: 19 });
const signedState20 = testScenarios.appState({ turnNum: 20 });
const signedState21 = testScenarios.appState({ turnNum: 21 });
const signedState22 = testScenarios.appState({ turnNum: 22 });
const preFundState0 = testScenarios.appState({ turnNum: 0 });

const theirTurn = testScenarios.channelStateFromStates([signedState19, signedState20]);
const ourTurn = testScenarios.channelStateFromStates([signedState20, signedState21]);

// --------
// Defaults
// --------
const processId = 'processId';
const storage = (channelState: ChannelState) =>
  testScenarios.setChannels(testScenarios.testEmptySharedData(), [channelState]);

const defaults = { processId, channelId, address, privateKey };

// ------
// States
// ------
const addressKnown = states.waitForFirstState({ channelId, address, privateKey });
const ongoing = states.ongoing({ channelId, address, privateKey });
const waitForDispute1 = states.waitForDispute({
  channelId,
  address,
  privateKey,
  disputeState: challengerPreSuccessOpenState,
});
const waitForDispute2 = states.waitForDispute({
  channelId,
  address,
  privateKey,
  disputeState: challengerPreSuccessClosedState,
});

// -------
// Actions
// -------

const receivePreFundSetup = actions.statesReceived({
  processId,
  signedStates: [preFundState0],
});
const receiveOurState = actions.statesReceived({
  processId,
  signedStates: [signedState22],
});
const receiveTheirState = actions.statesReceived({
  processId,
  signedStates: [signedState21],
});

const receiveTheirInvalidState = actions.statesReceived({
  processId,
  signedStates: [signedState19],
});
const receiveOurInvalidState = actions.statesReceived({
  processId,
  signedStates: [signedState20],
});

const concluded = actions.concluded({ processId: APPLICATION_PROCESS_ID });

const challengeRequested = actions.challengeRequested({ processId, channelId });

const challengeDetected = actions.challengeDetected({
  processId,
  channelId,
  signedState: signedState21,
  expiresAt: 999,
});

const disputeTerminated = { ...terminatingAction };

// -------
// SharedData
// -------
const emptySharedData = testScenarios.testEmptySharedData();
const ourTurnSharedData = storage(ourTurn);
const theirTurnSharedData = storage(theirTurn);

// -------
// Scenarios
// -------
export const initializingApplication = {
  ...defaults,
  initialize: { sharedData: emptySharedData },
};

export const startingApplication = {
  ...defaults,
  addressKnown: {
    state: addressKnown,
    sharedData: emptySharedData,
    action: receivePreFundSetup,
  },
};

export const receivingACloseRequest = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: ourTurnSharedData,
    action: concluded,
  },
};

export const receivingOurState = {
  ...defaults,
  ongoing: {
    sharedData: ourTurnSharedData,
    state: ongoing,
    action: receiveOurState,
  },
};

export const receivingTheirState = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: theirTurnSharedData,
    action: receiveTheirState,
  },
};

export const receivingTheirInvalidState = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: theirTurnSharedData,
    action: receiveTheirInvalidState,
  },
};

export const receivingOurInvalidState = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: ourTurnSharedData,
    action: receiveOurInvalidState,
  },
};

export const challengeWasRequested = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: ourTurnSharedData,
    action: challengeRequested,
  },
};
export const challengeWasDetected = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: ourTurnSharedData,
    action: challengeDetected,
  },
};
export const challengeRespondedTo = {
  ...defaults,
  waitForDispute: {
    state: waitForDispute1,
    sharedData: ourTurnSharedData,
    action: disputeTerminated,
  },
};
export const challengeExpired = {
  ...defaults,
  waitForDispute: {
    state: waitForDispute2,
    sharedData: ourTurnSharedData,
    action: disputeTerminated,
  },
};
