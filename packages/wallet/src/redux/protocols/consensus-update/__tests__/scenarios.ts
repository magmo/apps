import {
  ledgerCommitment,
  asAddress,
  bsAddress,
  ledgerId,
  threeWayLedgerCommitment,
  threeWayLedgerId,
  addressAndPrivateKeyLookup,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils';
import { setChannels, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as states from '../states';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../reducer';
import { commitmentsReceived } from '../../../../communication';
import { ThreePartyPlayerIndex, TwoPartyPlayerIndex } from '../../../types';
import { clearedToSend } from '../actions';
import { SignedCommitment } from '../../../../domain';

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];
const twoThreeOneTwo = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(2).toHexString() },
];

const twoThreeOne = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: asAddress, wei: bigNumberify(1).toHexString() },
];

const oneOneFour = [
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(1).toHexString() },
  { address: asAddress, wei: bigNumberify(4).toHexString() },
];
const ledger19 = ledgerCommitment({ turnNum: 19, balances: twoThree });
const ledger20 = ledgerCommitment({ turnNum: 20, balances: twoThree });
const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoThree });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: twoThree });
const ledger6 = ledgerCommitment({
  turnNum: 6,
  balances: twoThree,
  proposedBalances: twoThreeOneTwo,
});
const ledger7 = ledgerCommitment({
  turnNum: 7,
  balances: twoThreeOneTwo,
});
type TurnNum = 20 | 5 | 6 | 7;
const ledgers: { [turnNum in TurnNum]: SignedCommitment[] } = {
  20: [ledger19, ledger20],
  5: [ledger4, ledger5],
  6: [ledger5, ledger6],
  7: [ledger6, ledger7],
};

const threePlayerLedger6 = threeWayLedgerCommitment({ turnNum: 6, balances: twoThreeOne });
const threePlayerLedger7 = threeWayLedgerCommitment({ turnNum: 7, balances: twoThreeOne });
const threePlayerLedger8 = threeWayLedgerCommitment({ turnNum: 8, balances: twoThreeOne });
const threePlayerLedger9 = threeWayLedgerCommitment({
  turnNum: 9,
  balances: twoThreeOne,
  proposedBalances: oneOneFour,
});
const threePlayerLedger10 = threeWayLedgerCommitment({
  turnNum: 10,
  balances: twoThreeOne,
  proposedBalances: oneOneFour,
  isVote: true,
});
const threePlayerLedger11 = threeWayLedgerCommitment({
  turnNum: 11,
  balances: oneOneFour,
});

// ------
// SharedData
// ------

const threePlayerInitialSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      [threePlayerLedger6, threePlayerLedger7, threePlayerLedger8],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);
};
const threePlayerFirstUpdateSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);
};
const threePlayerSecondUpdateSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);
};

const twoPlayerSharedData = (turnNum: TurnNum, ourIndex: TwoPartyPlayerIndex) =>
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      ledgers[turnNum],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);

// ------
// States
// ------
const proposedAllocation = twoThreeOneTwo.map(b => b.wei);
const proposedDestination = twoThreeOneTwo.map(b => b.address);

const threePlayerProposedAllocation = oneOneFour.map(b => b.wei);
const threePlayerProposedDestination = oneOneFour.map(b => b.address);
const processId = 'process-id.123';

const twoProps = {
  channelId: ledgerId,
  processId,
  proposedAllocation,
  proposedDestination,
};

const threeProps = {
  channelId: threeWayLedgerId,
  processId,
  proposedAllocation: threePlayerProposedAllocation,
  proposedDestination: threePlayerProposedDestination,
};

const twoPlayerNotSafeToSend = (cleared: boolean) => {
  return states.notSafeToSend({
    ...twoProps,
    clearedToSend: cleared,
  });
};

const twoPlayerCommitmentSent = states.commitmentSent(twoProps);

const threePlayerNotSafeToSend = (cleared: boolean) => {
  return states.notSafeToSend({
    ...threeProps,
    clearedToSend: cleared,
  });
};

const threePlayerCommitmentSent = states.commitmentSent(threeProps);

// ------
// Actions
// ------
const protocolLocator = CONSENSUS_UPDATE_PROTOCOL_LOCATOR;
const twoPlayerUpdate0Received = commitmentsReceived({
  processId,
  signedCommitments: [ledger5, ledger6],
  protocolLocator,
});
const twoPlayerUpdate1Received = commitmentsReceived({
  processId,
  signedCommitments: [ledger6, ledger7],
  protocolLocator,
});
const twoPlayerWrongTurnReceived = commitmentsReceived({
  processId,
  signedCommitments: [ledger19, ledger20],
  protocolLocator,
});

const threePlayerUpdate0Received = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  protocolLocator,
});
const threePlayerUpdate1Received = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
  protocolLocator,
});

const threePlayerUpdate2Received = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger9, threePlayerLedger10, threePlayerLedger11],
  protocolLocator,
});
const clearedToSendAction = clearedToSend({
  processId,
  protocolLocator,
});

export const twoPlayerAHappyPath = {
  initialize: {
    channelId: ledgerId,
    proposedAllocation,
    proposedDestination,
    processId,
    sharedData: twoPlayerSharedData(5, TwoPartyPlayerIndex.A),
    reply: [ledger5, ledger6],
    clearedToSend: true,
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerUpdate1Received,
  },
};

export const twoPlayerANotOurTurn = {
  initialize: {
    channelId: ledgerId,
    proposedAllocation,
    proposedDestination,
    processId,
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.A),
    clearedToSend: true,
  },
  notSafeToSend: {
    state: twoPlayerNotSafeToSend(true),
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerUpdate1Received,
    reply: ledgers[7],
  },
};

export const twoPlayerBHappyPath = {
  initialize: {
    processId,
    channelId: ledgerId,
    proposedAllocation,
    proposedDestination,
    clearedToSend: true,
    sharedData: twoPlayerSharedData(5, TwoPartyPlayerIndex.B),
  },
  notSafeToSend: {
    state: twoPlayerNotSafeToSend(true),
    sharedData: twoPlayerSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerUpdate0Received,
    reply: [ledger6, ledger7],
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerUpdate0Received,
    reply: [ledger6, ledger7],
  },
};

export const twoPlayerBOurTurn = {
  initialize: {
    channelId: ledgerId,
    proposedAllocation,
    proposedDestination,
    processId,
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.B),
    reply: [ledger5, ledger6],
    clearedToSend: true,
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(7, TwoPartyPlayerIndex.B),
    action: twoPlayerUpdate1Received,
    reply: ledgers[7],
  },
};

export const twoPlayerACommitmentRejected = {
  wrongTurn: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerWrongTurnReceived,
  },
  notConsensus: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerWrongTurnReceived,
  },
};

export const twoPlayerBCommitmentRejected = {
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerWrongTurnReceived,
  },
};

export const threePlayerAHappyPath = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: true,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.A),
    reply: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  },
  waitForPlayerBUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.A),
    action: threePlayerUpdate1Received,
  },
  waitForHubUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerSecondUpdateSharedData(ThreePartyPlayerIndex.A),
    action: threePlayerUpdate2Received,
  },
};

export const threePlayerBHappyPath = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: true,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.B),
  },
  waitForPlayerAUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.B),
    action: threePlayerUpdate0Received,
    reply: [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
  },
  waitForHubUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerSecondUpdateSharedData(ThreePartyPlayerIndex.B),
    action: threePlayerUpdate2Received,
  },
};

export const threePlayerHubHappyPath = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: true,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
  },
  waitForPlayerAUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate0Received,
  },
  waitForPlayerBUpdate: {
    state: threePlayerCommitmentSent,
    sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate1Received,
    reply: [threePlayerLedger9, threePlayerLedger10, threePlayerLedger11],
  },
};

export const threePlayerANotClearedToSend = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: false,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.A),
  },
  notSafeToSendAndOurTurn: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.A),
    action: clearedToSendAction,
    reply: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  },
  notSafeToSendAndNotOurTurn: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.A),
    action: clearedToSendAction,
  },
};

export const threePlayerBNotClearedToSend = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: false,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.B),
  },
  notClearedToSendAndNotOurTurn: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.B),
    action: clearedToSendAction,
  },
  notClearedToSendAndOurTurn: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.B),
    action: clearedToSendAction,
    reply: [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
  },
};

export const threePlayerHubNotClearedToSend = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    proposedAllocation: threePlayerProposedAllocation,
    proposedDestination: threePlayerProposedDestination,
    clearedToSend: false,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
  },
  waitForPlayerAUpdate: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate0Received,
  },
  waitForPlayerBUpdate: {
    state: threePlayerNotSafeToSend(false),
    sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate1Received,
  },
  waitForClearedToSend: {
    state: threePlayerNotSafeToSend(false),
    action: clearedToSendAction,
    sharedData: threePlayerSecondUpdateSharedData(ThreePartyPlayerIndex.Hub),
    reply: [threePlayerLedger9, threePlayerLedger10, threePlayerLedger11],
  },
};

export const threePlayerNotOurTurn = {
  playerA: {
    initialize: {
      channelId: threeWayLedgerId,
      processId,
      proposedAllocation: threePlayerProposedAllocation,
      proposedDestination: threePlayerProposedDestination,
      clearedToSend: true,
      sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.A),
    },
  },
};
