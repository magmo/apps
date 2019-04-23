import * as states from '../state';
import * as testScenarios from '../../../__tests__/test-scenarios';
import {
  ChannelStatus,
  RUNNING,
  WAIT_FOR_UPDATE,
  ChannelState,
} from '../../../channel-state/state';
import { EMPTY_SHARED_DATA, SharedData } from '../../../state';
import * as actions from '../../../actions';
import { AdjudicatorState } from '../../../adjudicator-state/state';

// Various state propties
const processId = 'processid.123';
const {
  asAddress: address,
  asPrivateKey: privateKey,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  ledgerCommitments,
} = testScenarios;

const channelStatus: ChannelStatus = {
  address,
  privateKey,
  stage: RUNNING,
  type: WAIT_FOR_UPDATE,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  funded: true,
  ourIndex: 0,
  turnNum: ledgerCommitments.ledgerUpdate2.turnNum,
  lastCommitment: { commitment: ledgerCommitments.ledgerUpdate2, signature: '0x0' },
  penultimateCommitment: { commitment: ledgerCommitments.ledgerUpdate1, signature: '0x0' },
};

const playerAStartChannelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: channelStatus,
  },
};

const playerAWaitForCommitmentChannelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: {
      ...channelStatus,
      lastCommitment: { commitment: ledgerCommitments.ledgerDefundUpdate2, signature: '0x0' },
      penultimateCommitment: {
        commitment: ledgerCommitments.ledgerDefundUpdate1,
        signature: '0x0',
      },
      turnNum: ledgerCommitments.ledgerDefundUpdate2.turnNum,
    },
  },
};

const playerBChannelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: { ...channelStatus, ourIndex: 1 },
  },
};
const adjudicatorState: AdjudicatorState = {
  [channelId]: {
    finalized: true,
    channelId,
    balance: '0x0',
  },
};

const notClosedAdjudicatorState: AdjudicatorState = {
  [channelId]: {
    finalized: false,
    channelId,
    balance: '0x0',
  },
};

const playerAStartSharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState,
  channelState: playerAStartChannelState,
};

const playerAWaitForUpdateSharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState,
  channelState: playerAWaitForCommitmentChannelState,
};

const playerBSharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState,
  channelState: playerBChannelState,
};

const notDefundableSharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState: notClosedAdjudicatorState,
  channelState: playerAStartChannelState,
};

const {
  allocation: proposedAllocation,
  destination: proposedDestination,
} = ledgerCommitments.ledgerDefundUpdate3;

// Actions
const playerACommitmentReceived = actions.commitmentReceived(
  processId,
  ledgerCommitments.ledgerDefundUpdate2,
  '0x0',
);
const playerBFirstCommitmentReceived = actions.commitmentReceived(
  processId,
  ledgerCommitments.ledgerDefundUpdate2,
  '0x0',
);
const playerBFinalCommitmentReceived = actions.commitmentReceived(
  processId,
  ledgerCommitments.ledgerDefundUpdate3,
  '0x0',
);

const invalidCommitmentReceived = actions.commitmentReceived(
  processId,
  ledgerCommitments.preFundCommitment0,
  '0x0',
);

// Indirect Defunding States
const waitForLedgerUpdate = states.waitForLedgerUpdate({
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
});
const waitForFinalLedgerUpdate = states.waitForFinalLedgerUpdate({
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
});
const notDefundableFailure = states.failure('Channel Not Closed');
const invalidCommitmentFailure = states.failure('Received Invalid Commitment');

// Scenarios
export const playerAHappyPath = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  firstUpdateCommitment: ledgerCommitments.ledgerDefundUpdate1,
  secondUpdateCommitment: ledgerCommitments.ledgerDefundUpdate3,
  states: {
    waitForLedgerUpdate,
  },
  actions: {
    commitmentReceived: playerACommitmentReceived,
  },
  sharedData: {
    initializingSharedData: playerAStartSharedData,
    waitForLedgerUpdateSharedData: playerAWaitForUpdateSharedData,
  },
};

export const playerBHappyPath = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  updateCommitment: ledgerCommitments.ledgerDefundUpdate2,

  states: {
    waitForLedgerUpdate,
    waitForFinalLedgerUpdate,
  },
  actions: {
    firstCommitmentReceived: playerBFirstCommitmentReceived,
    finalCommitmentReceived: playerBFinalCommitmentReceived,
  },
  sharedData: playerBSharedData,
};

export const notDefundable = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  sharedData: notDefundableSharedData,
  states: {
    failure: notDefundableFailure,
  },
};

export const playerAInvalidCommitment = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  sharedData: playerAStartSharedData,
  states: {
    waitForLedgerUpdate,
    failure: invalidCommitmentFailure,
  },
  actions: {
    commitmentReceived: invalidCommitmentReceived,
  },
};

export const playerBInvalidFirstCommitment = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  sharedData: playerBSharedData,
  states: {
    waitForLedgerUpdate,
    failure: invalidCommitmentFailure,
  },
  actions: {
    firstCommitmentReceived: invalidCommitmentReceived,
  },
};

export const playerBInvalidFinalCommitment = {
  processId,
  channelId,
  proposedAllocation,
  proposedDestination,
  sharedData: playerBSharedData,
  states: {
    waitForLedgerUpdate,
    waitForFinalLedgerUpdate,
    failure: invalidCommitmentFailure,
  },
  actions: {
    firstCommitmentReceived: playerBFirstCommitmentReceived,
    finalCommitmentReceived: invalidCommitmentReceived,
  },
};
