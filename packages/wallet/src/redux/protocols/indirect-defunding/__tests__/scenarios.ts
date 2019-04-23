import * as states from '../state';
import * as testScenarios from '../../../__tests__/test-scenarios';
import {
  ChannelStatus,
  RUNNING,
  WAIT_FOR_UPDATE,
  ChannelState,
  setChannel,
  emptyChannelState,
  FINALIZED,
} from '../../../channel-state/state';
import { EMPTY_SHARED_DATA, SharedData, FundingState } from '../../../state';
import * as actions from '../../../actions';
import { AdjudicatorState } from '../../../adjudicator-state/state';

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

const playerAChannelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: channelStatus,
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
const playerASharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState,
  channelState: playerAChannelState,
};
const playerBSharedData: SharedData = {
  ...EMPTY_SHARED_DATA,
  adjudicatorState,
  channelState: playerBChannelState,
};
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

const waitForLedgerUpdate = states.waitForLedgerUpdate({ processId, channelId });
const waitForFinalLedgerUpdate = states.waitForFinalLedgerUpdate({ processId, channelId });

export const playerAHappyPath = {
  processId,
  channelId,
  firstUpdateCommitment: ledgerCommitments.ledgerDefundUpdate1,
  secondUpdateCommitment: ledgerCommitments.ledgerDefundUpdate3,
  states: {
    waitForLedgerUpdate,
  },
  actions: {
    commitmentReceived: playerACommitmentReceived,
  },
  sharedData: playerASharedData,
};

export const playerBHappyPath = {
  processId,
  channelId,
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
