import {
  ledgerState,
  asAddress,
  bsAddress,
  TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  threeWayLedgerState,
  setChannels,
  channelStateFromStates,
  THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
  convertAddressToBytes32,
  testEmptySharedData,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils';

import * as states from '../states';
import { statesReceived } from '../../../../communication';
import { ThreePartyPlayerIndex, TwoPartyPlayerIndex } from '../../../types';
import { clearedToSend } from '../actions';
import { unreachable } from '../../../../utils/reducer-utils';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';
import { ETH_ASSET_HOLDER } from '../../../../constants';
import { SignedState } from 'nitro-protocol';

const protocolLocator = [];

const twoThree: Outcome = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(2).toHexString() },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(3).toHexString() },
    ],
  },
];

const threeTwo = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(3).toHexString() },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(2).toHexString() },
    ],
  },
];

const twoThreeOne = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(2).toHexString() },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(3).toHexString() },
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(1).toHexString() },
    ],
  },
];

const oneOneFour = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(1).toHexString() },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(1).toHexString() },
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(4).toHexString() },
    ],
  },
];
// Commitments that have reached consensus
const outcome = twoThree;
const proposedOutcome = threeTwo;
const ledger4 = ledgerState({ turnNum: 4, outcome });
const ledger5 = ledgerState({ turnNum: 5, outcome });
const ledger6 = ledgerState({ turnNum: 6, outcome });
const ledger6ConsensusOnProposed = ledgerState({ turnNum: 6, outcome: proposedOutcome });
const ledger7 = ledgerState({ turnNum: 7, outcome: proposedOutcome });
const ledger8 = ledgerState({ turnNum: 8, outcome: proposedOutcome });
const ledger20 = ledgerState({ turnNum: 20, outcome: proposedOutcome });

// Commitments that propose a new consensus
const ledger5Propose = ledgerState({ turnNum: 5, outcome, proposedOutcome });
const ledger6Propose = ledgerState({ turnNum: 6, outcome, proposedOutcome });
const ledger7ProposeWrongProposedBalances = ledgerState({
  turnNum: 7,
  outcome,
  proposedOutcome: oneOneFour,
});
const ledger7Propose = ledgerState({
  turnNum: 7,
  outcome,
  proposedOutcome,
});
const ledger8Propose = ledgerState({ turnNum: 8, outcome, proposedOutcome });
const ledger19Propose = ledgerState({ turnNum: 19, outcome, proposedOutcome });

type AcceptConsensusOnBalancesTurnNum = 5 | 6;
function acceptConsensusOnBalancesLedgers(turnNum: AcceptConsensusOnBalancesTurnNum) {
  switch (turnNum) {
    case 5:
      return [ledger4, ledger5];
    case 6:
      return [ledger5, ledger6];
    default:
      return unreachable(turnNum);
  }
}

type AcceptConsensusOnProposedBalancesTurnNum = 6 | 7 | 8 | 20;
function acceptConsensusOnProposedBalancesLedgers(
  turnNum: AcceptConsensusOnProposedBalancesTurnNum,
) {
  switch (turnNum) {
    case 6:
      return [ledger5Propose, ledger6ConsensusOnProposed];
    case 7:
      return [ledger6Propose, ledger7];
    case 8:
      return [ledger7Propose, ledger8];
    case 20:
      return [ledger19Propose, ledger20];
    default:
      return unreachable(turnNum);
  }
}

type ProposeTurnNum = 5 | 6 | 7 | 8;
const proposeLedgers: { [turnNum in ProposeTurnNum]: SignedState[] } = {
  5: [ledger4, ledger5Propose],
  6: [ledger5, ledger6Propose],
  7: [ledger6, ledger7Propose],
  8: [ledger7ProposeWrongProposedBalances, ledger8Propose],
};

type ProposeOldTurnNum = 7;
const proposeOldLedgers: { [turnNum in ProposeOldTurnNum]: SignedState[] } = {
  7: [ledger6, ledger7ProposeWrongProposedBalances],
};

const threePlayerLedger6 = threeWayLedgerState({ turnNum: 6, outcome: twoThreeOne });
const threePlayerLedger7 = threeWayLedgerState({ turnNum: 7, outcome: twoThreeOne });
const threePlayerLedger8 = threeWayLedgerState({ turnNum: 8, outcome: twoThreeOne });
const threePlayerLedger9 = threeWayLedgerState({
  turnNum: 9,
  outcome: twoThreeOne,
  proposedOutcome: oneOneFour,
  furtherVotesRequired: 2,
});
const threePlayerLedger10 = threeWayLedgerState({
  turnNum: 10,
  outcome: twoThreeOne,
  proposedOutcome: oneOneFour,
  furtherVotesRequired: 1,
});
const threePlayerLedger11 = threeWayLedgerState({
  turnNum: 11,
  outcome: oneOneFour,
});

// ------
// SharedData
// ------

const threePlayerInitialSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(testEmptySharedData(), [
    channelStateFromStates([threePlayerLedger6, threePlayerLedger7, threePlayerLedger8]),
  ]);
};
const threePlayerFirstUpdateSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(testEmptySharedData(), [
    channelStateFromStates([threePlayerLedger7, threePlayerLedger8, threePlayerLedger9]),
  ]);
};
const threePlayerSecondUpdateSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(testEmptySharedData(), [
    channelStateFromStates([threePlayerLedger8, threePlayerLedger9, threePlayerLedger10]),
  ]);
};

const twoPlayerConsensusAcceptedOnBalancesSharedData = (
  turnNum: AcceptConsensusOnBalancesTurnNum,
  ourIndex: TwoPartyPlayerIndex,
) =>
  setChannels(testEmptySharedData(), [
    channelStateFromStates(acceptConsensusOnBalancesLedgers(turnNum)),
  ]);

const twoPlayerConsensusAcceptedOnProposedBalancesSharedData = (
  turnNum: AcceptConsensusOnProposedBalancesTurnNum,
  ourIndex: TwoPartyPlayerIndex,
) =>
  setChannels(testEmptySharedData(), [
    channelStateFromStates(acceptConsensusOnProposedBalancesLedgers(turnNum)),
  ]);

const twoPlayerNewProposalSharedData = (turnNum: ProposeTurnNum, ourIndex: TwoPartyPlayerIndex) =>
  setChannels(testEmptySharedData(), [channelStateFromStates(proposeLedgers[turnNum])]);

// ------
// States
// ------

const processId = 'process-id.123';

const twoProps = {
  channelId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  processId,
  proposedOutcome,
  protocolLocator,
};

const threeProps = {
  channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
  processId,
  proposedOutcome: oneOneFour,
  protocolLocator,
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
function twoPlayerNewProposalCommitmentsReceived(turnNum: ProposeTurnNum) {
  return statesReceived({
    processId,
    signedStates: proposeLedgers[turnNum],
    protocolLocator,
  });
}
function twoPlayerWrongProposalCommitmentsReceived(turnNum: ProposeTurnNum) {
  return statesReceived({
    processId,
    signedStates: proposeOldLedgers[turnNum],
    protocolLocator,
  });
}
function twoPlayerAcceptConsensusOnProposedBalancesCommitmentsReceived(
  turnNum: AcceptConsensusOnProposedBalancesTurnNum,
) {
  return statesReceived({
    processId,
    signedStates: acceptConsensusOnProposedBalancesLedgers(turnNum),
    protocolLocator,
  });
}

const threePlayerUpdate0Received = statesReceived({
  processId,
  signedStates: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  protocolLocator,
});
const threePlayerUpdate1Received = statesReceived({
  processId,
  signedStates: [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
  protocolLocator,
});

const threePlayerUpdate2Received = statesReceived({
  processId,
  signedStates: [threePlayerLedger9, threePlayerLedger10, threePlayerLedger11],
  protocolLocator,
});
const clearedToSendAction = clearedToSend({
  processId,
  protocolLocator,
});

export const twoPlayerAHappyPath = {
  initialize: {
    channelId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    proposedOutcome,
    processId,
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(5, TwoPartyPlayerIndex.A),
    reply: [ledger5, ledger6Propose],
    clearedToSend: true,
    protocolLocator,
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerNewProposalSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerAcceptConsensusOnProposedBalancesCommitmentsReceived(7),
  },
};

export const twoPlayerANotOurTurn = {
  initialize: {
    channelId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    proposedOutcome,
    processId,
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(6, TwoPartyPlayerIndex.A),
    clearedToSend: true,
    protocolLocator,
  },
  notSafeToSend: {
    state: twoPlayerNotSafeToSend(true),
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerNewProposalCommitmentsReceived(7),
    reply: acceptConsensusOnProposedBalancesLedgers(8),
  },
};

export const twoPlayerBHappyPath = {
  initialize: {
    processId,
    channelId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    proposedOutcome,
    clearedToSend: true,
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(5, TwoPartyPlayerIndex.B),
    protocolLocator,
  },
  notSafeToSend: {
    state: twoPlayerNotSafeToSend(true),
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerNewProposalCommitmentsReceived(6),
    reply: acceptConsensusOnProposedBalancesLedgers(7),
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerConsensusAcceptedOnBalancesSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerNewProposalCommitmentsReceived(6),
  },
};

export const twoPlayerBOurTurn = {
  initialize: {
    channelId: TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    proposedOutcome,
    processId,
    sharedData: twoPlayerConsensusAcceptedOnProposedBalancesSharedData(6, TwoPartyPlayerIndex.B),
    reply: [ledger5, ledger6Propose],
    clearedToSend: true,
    protocolLocator,
  },
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerNewProposalSharedData(6, TwoPartyPlayerIndex.B),
    action: twoPlayerAcceptConsensusOnProposedBalancesCommitmentsReceived(7),
  },
};

export const twoPlayerACommitmentRejected = {
  wrongTurn: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerNewProposalSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerAcceptConsensusOnProposedBalancesCommitmentsReceived(20),
  },
  wrongProposalWhenCommitmentNotSent: {
    state: twoPlayerNotSafeToSend(true),
    sharedData: twoPlayerNewProposalSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerWrongProposalCommitmentsReceived(7),
    reply: proposeLedgers[8],
  },
  notConsensusWhenCommitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerNewProposalSharedData(6, TwoPartyPlayerIndex.A),
    action: twoPlayerNewProposalCommitmentsReceived(7),
  },
};

export const twoPlayerBCommitmentRejected = {
  commitmentSent: {
    state: twoPlayerCommitmentSent,
    sharedData: twoPlayerNewProposalSharedData(5, TwoPartyPlayerIndex.B),
    action: twoPlayerAcceptConsensusOnProposedBalancesCommitmentsReceived(20),
  },
};

export const threePlayerAHappyPath = {
  initialize: {
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: true,
    protocolLocator,
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
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: true,
    protocolLocator,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.B),
  },
  waitForPlayerAUpdate: {
    state: threePlayerNotSafeToSend(true),
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
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: true,
    protocolLocator,
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
  },
  waitForPlayerAUpdate: {
    state: threePlayerNotSafeToSend(true),
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate0Received,
  },
  waitForPlayerBUpdate: {
    state: threePlayerNotSafeToSend(true),
    sharedData: threePlayerInitialSharedData(ThreePartyPlayerIndex.Hub),
    action: threePlayerUpdate1Received,
    reply: [threePlayerLedger9, threePlayerLedger10, threePlayerLedger11],
  },
};

export const threePlayerANotClearedToSend = {
  initialize: {
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: false,
    protocolLocator,
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
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: false,
    protocolLocator,
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
    action: threePlayerUpdate0Received,
    reply: [threePlayerLedger8, threePlayerLedger9, threePlayerLedger10],
  },
};

export const threePlayerHubNotClearedToSend = {
  initialize: {
    channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
    processId,
    proposedOutcome: oneOneFour,
    clearedToSend: false,
    protocolLocator,
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
      channelId: THREE_PARTICIPANT_LEDGER_CHANNEL_ID,
      processId,
      proposedOutcome: oneOneFour,
      clearedToSend: true,
      sharedData: threePlayerFirstUpdateSharedData(ThreePartyPlayerIndex.A),
    },
  },
};
