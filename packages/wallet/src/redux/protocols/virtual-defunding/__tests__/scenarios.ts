import { appState } from '../../../../domain/commitments/__tests__';

import * as scenarios from '../../../../domain/commitments/__tests__';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import * as states from '../states';
import { EMPTY_SHARED_DATA, setFundingState } from '../../../state';
import _ from 'lodash';
import { bigNumberify } from 'ethers/utils/bignumber';

import { statesReceived, EmbeddedProtocol } from '../../../../communication';
import { makeLocator } from '../..';
import * as consensusStates from '../../consensus-update/states';
import { HUB_ADDRESS } from '../../../../constants';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { encodeConsensusData } from 'nitro-protocol/lib/src/contract/consensus-data';

// ---------
// Test data
// ---------
const processId = 'Process.123';

const { asAddress, bsAddress } = scenarios;
const hubAddress = HUB_ADDRESS;
const twoTwo = scenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: hubAddress, wei: bigNumberify(2).toHexString() },
]);
const oneThree = scenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);
const oneThreeHub = scenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: hubAddress, wei: bigNumberify(3).toHexString() },
]);
const oneThreeTwo = scenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: hubAddress, wei: bigNumberify(2).toHexString() },
]);

const app10 = appState({ turnNum: 10, outcome: oneThree, isFinal: true });
const app11 = appState({ turnNum: 11, outcome: oneThree, isFinal: true });
const appChannel = scenarios.channelStateFromStates([app10, app11]);
const appChannelId = getChannelId(appChannel.channel);

const ledger6 = scenarios.ledgerState({ turnNum: 6, outcome: twoTwo });
const ledger7 = scenarios.ledgerState({ turnNum: 7, outcome: twoTwo });
const ledger8 = scenarios.ledgerState({
  turnNum: 8,
  outcome: twoTwo,
  proposedOutcome: oneThreeHub,
});
const ledger9 = scenarios.ledgerState({
  turnNum: 9,
  outcome: oneThreeHub,
});

const ledgerChannelBeforeUpdate = scenarios.channelStateFromStates([ledger6, ledger7]);

const ledgerChannelBeforeConsensus = scenarios.channelStateFromStates([ledger7, ledger8]);

const ledgerId = getChannelId(ledgerChannelBeforeUpdate.channel);
const fundingApp = scenarios.convertBalanceToOutcome([
  { address: appChannelId, wei: bigNumberify(6).toHexString() },
]);

const joint4 = scenarios.threeWayLedgerState({ turnNum: 4, outcome: fundingApp });
const joint5 = scenarios.threeWayLedgerState({ turnNum: 5, outcome: fundingApp });
const joint6 = scenarios.threeWayLedgerState({
  turnNum: 6,
  outcome: fundingApp,
  proposedOutcome: oneThreeTwo,
  furtherVotesRequired: 2,
});
const joint7 = scenarios.threeWayLedgerState({
  turnNum: 7,
  outcome: fundingApp,
  proposedOutcome: oneThreeTwo,
  furtherVotesRequired: 1,
});
const joint8 = scenarios.threeWayLedgerState({ turnNum: 8, outcome: oneThreeTwo });
const jointChannelFundingApp = scenarios.channelStateFromStates([joint4, joint5]);
const jointChannelBeforeConsensus = scenarios.channelStateFromStates([joint6, joint7]);
const jointChannelId = getChannelId(jointChannelFundingApp.channel);

const guarantorChannelId = '0x01';

const startingOutcome = app10.state.outcome;

const props = {
  targetChannelId: appChannelId,
  processId,
  startingOutcome,
  hubAddress,
  ourIndex: PlayerIndex.A,
  protocolLocator: [],
  ourAddress: asAddress,
  jointChannelId,
  ledgerChannelId: ledgerId,
};

// ----
// States
// ------
const waitForJointChannelUpdate = states.waitForJointChannelUpdate({
  ...props,
  jointChannel: consensusStates.commitmentSent({
    processId,
    protocolLocator: makeLocator(EmbeddedProtocol.ConsensusUpdate),
    proposedOutcome: oneThreeTwo,
    channelId: jointChannelId,
  }),
});
const waitForLedgerChannelUpdate = states.waitForLedgerChannelUpdate({
  ...props,
  ledgerChannel: consensusStates.commitmentSent({
    processId,
    protocolLocator: makeLocator(EmbeddedProtocol.ConsensusUpdate),
    proposedOutcome: oneThreeHub,
    channelId: ledgerId,
  }),
});

// ----
// Shared Data
// ------

const createFundingState = sharedData => {
  sharedData = setFundingState(sharedData, appChannelId, {
    fundingChannel: jointChannelId,
    directlyFunded: false,
  });
  sharedData = setFundingState(sharedData, jointChannelId, {
    guarantorChannel: guarantorChannelId,
    directlyFunded: false,
  });
  sharedData = setFundingState(sharedData, guarantorChannelId, {
    fundingChannel: ledgerId,
    directlyFunded: false,
  });
  sharedData = setFundingState(sharedData, ledgerId, { directlyFunded: true });
  return sharedData;
};

const initialSharedData = createFundingState(
  scenarios.setChannels(EMPTY_SHARED_DATA, [jointChannelFundingApp, appChannel]),
);

const waitForJointSharedData = createFundingState(
  scenarios.setChannels(EMPTY_SHARED_DATA, [
    jointChannelBeforeConsensus,
    ledgerChannelBeforeUpdate,
    appChannel,
  ]),
);

const waitForLedgerSharedData = createFundingState(
  scenarios.setChannels(EMPTY_SHARED_DATA, [ledgerChannelBeforeConsensus, appChannel]),
);
// ----
// Actions
// ------
const jointCommitmentReceived = statesReceived({
  processId,
  protocolLocator: makeLocator(EmbeddedProtocol.ConsensusUpdate),
  signedStates: [joint8],
});

const ledgerCommitmentReceived = statesReceived({
  processId,
  protocolLocator: makeLocator(EmbeddedProtocol.ConsensusUpdate),
  signedStates: [ledger9],
});

export const happyPath = {
  ...props,
  initialize: {
    ...props,
    appData: encodeConsensusData({ proposedOutcome: [], furtherVotesRequired: 2 }), // TODO: set correct proposed outcome
    sharedData: initialSharedData,
  },
  waitForJointChannel: {
    state: waitForJointChannelUpdate,
    action: jointCommitmentReceived,
    sharedData: waitForJointSharedData,
    appData: encodeConsensusData({
      proposedOutcome: [],
      furtherVotesRequired: 1,
    }), // TODO: set correct proposed outcome
  },
  waitForLedgerChannel: {
    state: waitForLedgerChannelUpdate,
    action: ledgerCommitmentReceived,
    sharedData: waitForLedgerSharedData,
  },
};
