import * as channelScenarios from '../../../__tests__/test-scenarios';
import * as states from '../states';

import * as actions from '../actions';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, asAddress: address, asPrivateKey: privateKey } = channelScenarios;
import { ChannelState } from '../../../channel-store';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { EMPTY_SHARED_DATA, setChannel } from '../../../state';
import {
  challengerPreSuccessClosedState,
  challengerPreSuccessOpenState,
  terminatingAction,
} from '../../dispute/challenger';
import { APPLICATION_PROCESS_ID } from '../reducer';

const {
  signedCommitment19,
  signedCommitment20,
  signedCommitment21,
  signedCommitment22,
  preFundCommitment0,
} = channelScenarios;
const theirTurn = channelFromCommitments(
  [signedCommitment19, signedCommitment20],
  address,
  privateKey,
);
const ourTurn = channelFromCommitments(
  [signedCommitment20, signedCommitment21],
  address,
  privateKey,
);

// --------
// Defaults
// --------
const processId = 'processId';
const storage = (channelState: ChannelState) => setChannel(EMPTY_SHARED_DATA, channelState);

const defaults = { processId, channelId, address, privateKey };

// ------
// States
// ------
const addressKnown = states.waitForFirstCommitment({ channelId, address, privateKey });
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

const receivePreFundSetup = actions.ownCommitmentReceived({
  processId,
  commitment: preFundCommitment0,
});
const receiveOurCommitment = actions.ownCommitmentReceived({
  processId,
  commitment: signedCommitment22.commitment,
});
const { commitment, signature } = signedCommitment21;
const receiveTheirCommitment = actions.opponentCommitmentReceived({
  processId,
  commitment,
  signature,
});

const receiveTheirInvalidCommitment = actions.opponentCommitmentReceived({
  processId,
  commitment: signedCommitment19.commitment,
  signature: signedCommitment19.signature,
});
const receiveOurInvalidCommitment = actions.ownCommitmentReceived({
  processId,
  commitment: signedCommitment20.commitment,
});

const concluded = actions.concluded({ processId: APPLICATION_PROCESS_ID });

const challengeRequested = actions.challengeRequested({ processId, channelId, commitment });

const challengeDetected = actions.challengeDetected({
  processId,
  channelId,
  commitment,
  expiresAt: 999,
});

const disputeTerminated = { ...terminatingAction };

// -------
// SharedData
// -------
const emptySharedData = EMPTY_SHARED_DATA;
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

export const receivingOurCommitment = {
  ...defaults,
  ongoing: {
    sharedData: ourTurnSharedData,
    state: ongoing,
    action: receiveOurCommitment,
  },
};

export const receivingTheirCommitment = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: theirTurnSharedData,
    action: receiveTheirCommitment,
  },
};

export const receivingTheirInvalidCommitment = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: theirTurnSharedData,
    action: receiveTheirInvalidCommitment,
  },
};

export const receivingOurInvalidCommitment = {
  ...defaults,
  ongoing: {
    state: ongoing,
    sharedData: ourTurnSharedData,
    action: receiveOurInvalidCommitment,
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
