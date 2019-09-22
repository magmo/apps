import {
  ledgerState,
  asAddress,
  bsAddress,
  TWO_PARTICIPANT_LEDGER_CHANNEL,
  channelId,
  appState,
  convertBalanceToOutcome,
  setChannels,
  channelStateFromStates,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils/bignumber';
import { SharedData, EMPTY_SHARED_DATA } from '../../../state';
import * as states from '../states';

import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../reducer';
import { playerAHappyPath } from '../../ledger-top-up/__tests__/scenarios';
import {
  twoPlayerPreSuccessA as consensusUpdatePreSuccessA,
  twoPlayerPreSuccessB as consensusUpdatePreSuccessB,
} from '../../consensus-update/__tests__/';
import { makeLocator, prependToLocator } from '../..';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../../consensus-update/reducer';
import { statesReceived } from '../../../../communication';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
const processId = 'processId';
const oneThree = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);

const twoTwo = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(2).toHexString() },
]);

const fourFour = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(4).toHexString() },
  { address: bsAddress, wei: bigNumberify(4).toHexString() },
]);
const oneOne = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(1).toHexString() },
]);

const fourToApp = convertBalanceToOutcome([
  { address: channelId, wei: bigNumberify(4).toHexString() },
]);
const fourToAppAndLeftOver = convertBalanceToOutcome([
  { address: channelId, wei: bigNumberify(4).toHexString() },
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(2).toHexString() },
]);
const props = {
  channelId,
  ledgerId: getChannelId(TWO_PARTICIPANT_LEDGER_CHANNEL),
  processId,
  startingOutcome: oneThree,
  protocolLocator: EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
};

const propsA = {
  ...props,
  consensusUpdateState: consensusUpdatePreSuccessA.state,
};

const propsB = {
  ...props,
  consensusUpdateState: consensusUpdatePreSuccessB.state,
};

const setFundingState = (sharedData: SharedData): SharedData => {
  return {
    ...sharedData,
    fundingState: {
      [channelId]: {
        directlyFunded: false,
        fundingChannel: getChannelId(TWO_PARTICIPANT_LEDGER_CHANNEL),
      },
      [getChannelId(TWO_PARTICIPANT_LEDGER_CHANNEL)]: { directlyFunded: true },
    },
  };
};

// -----------
// Commitments
// -----------
const ledger4 = ledgerState({ turnNum: 4, outcome: oneThree });
const ledger5 = ledgerState({ turnNum: 5, outcome: oneThree });
const ledger6 = ledgerState({ turnNum: 6, outcome: oneThree, proposedOutcome: fourToApp });

const ledger4Partial = ledgerState({ turnNum: 4, outcome: fourFour });
const ledger5Partial = ledgerState({ turnNum: 5, outcome: fourFour });
const ledger6Partial = ledgerState({
  turnNum: 6,
  outcome: fourFour,
  proposedOutcome: fourToAppAndLeftOver,
});
const topUpLedger4 = ledgerState({ turnNum: 4, outcome: oneOne });
const topUpLedger5 = ledgerState({ turnNum: 5, outcome: oneOne });

const app0 = appState({ turnNum: 0, outcome: oneThree });
const app1 = appState({ turnNum: 1, outcome: oneThree });
// -----------
// Shared Data
// -----------

const initialPlayerALedgerSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([ledger4, ledger5]),
    channelStateFromStates([app0, app1]),
  ]),
);

const initialPlayerAPartialSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([ledger4Partial, ledger5Partial]),
    channelStateFromStates([app0, app1]),
  ]),
);

const initialPlayerATopUpNeededSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([topUpLedger4, topUpLedger5]),
    channelStateFromStates([app0, app1]),
  ]),
);

const playerAFirstCommitmentReceived = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([ledger5, ledger6]),
    channelStateFromStates([app0, app1]),
  ]),
);

const initialPlayerBLedgerSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([ledger4, ledger5]),
    channelStateFromStates([app0, app1]),
  ]),
);

const initialPlayerBTopUpNeededSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelStateFromStates([topUpLedger4, topUpLedger5]),
    channelStateFromStates([app0, app1]),
  ]),
);

// -----------
// States
// -----------
const waitForLedgerUpdateForA = states.waitForLedgerUpdate(propsA);
const waitForLedgerUpdateForB = states.waitForLedgerUpdate(propsB);

const invalidLedgerUpdateReceived = statesReceived({
  processId,
  signedStates: [ledger5],
  protocolLocator: makeLocator(
    EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
  ),
});

export const playerAFullyFundedHappyPath = {
  initialize: {
    sharedData: initialPlayerALedgerSharedData,
    ...props,
    reply: [ledger5, ledger6],
  },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdateForA,
    sharedData: consensusUpdatePreSuccessA.sharedData,
    action: prependToLocator(
      consensusUpdatePreSuccessA.action,
      EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    ),
  },
};

export const partialLedgerChannelUse = {
  initialize: {
    sharedData: initialPlayerAPartialSharedData,
    ...props,
    startingOutcome: twoTwo,
    reply: [ledger5Partial, ledger6Partial],
  },
};

export const playerBFullyFundedHappyPath = {
  initialize: {
    sharedData: initialPlayerBLedgerSharedData,
    ...props,
  },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdateForB,
    sharedData: consensusUpdatePreSuccessB.sharedData,
    action: prependToLocator(
      consensusUpdatePreSuccessB.action,
      EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR,
    ),
    reply: consensusUpdatePreSuccessB.reply,
  },
};

export const playerAInvalidUpdateCommitment = {
  waitForLedgerUpdate: {
    state: waitForLedgerUpdateForA,
    sharedData: playerAFirstCommitmentReceived,
    action: invalidLedgerUpdateReceived,
  },
};

export const playerBInvalidUpdateCommitment = {
  waitForLedgerUpdate: {
    state: waitForLedgerUpdateForB,
    sharedData: initialPlayerBLedgerSharedData,
    action: invalidLedgerUpdateReceived,
  },
};

export const playerATopUpNeeded = {
  initialize: {
    sharedData: initialPlayerATopUpNeededSharedData,
    ...props,
  },
  waitForLedgerTopUp: {
    state: states.waitForLedgerTopUp({
      ...props,
      ledgerTopUpState: playerAHappyPath.switchOrderAndAddATopUpUpdate.state,
      consensusUpdateState: consensusUpdatePreSuccessA.state,
    }),
  },
};

export const playerBTopUpNeeded = {
  initialize: {
    sharedData: initialPlayerBTopUpNeededSharedData,
    ...props,
  },
};
