import {
  asAddress,
  bsAddress,
  threeWayLedgerCommitment,
  addressAndPrivateKeyLookup,
  threeWayLedgerId,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils/bignumber';
import { ThreePartyPlayerIndex } from '../../../types';
import { setChannels, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { commitmentsReceived } from '../../../../communication';
import { CHANNEL_SYNC_PROTOCOL_LOCATOR } from '../reducer';
import * as states from '../states';
const processId = 'process-id.123';
const twoThreeOne = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: asAddress, wei: bigNumberify(1).toHexString() },
];
const threePlayerLedger6 = threeWayLedgerCommitment({ turnNum: 6, balances: twoThreeOne });
const threePlayerLedger7 = threeWayLedgerCommitment({ turnNum: 7, balances: twoThreeOne });
const threePlayerLedger8 = threeWayLedgerCommitment({ turnNum: 8, balances: twoThreeOne });
export const threePlayerLedger9 = threeWayLedgerCommitment({
  turnNum: 9,
  balances: twoThreeOne,
});

const ledger8ReceivedSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      [threePlayerLedger6, threePlayerLedger7, threePlayerLedger8],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);
};

const ledger9ReceivedSharedData = (ourIndex: ThreePartyPlayerIndex) => {
  return setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(
      [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
      addressAndPrivateKeyLookup[ourIndex].address,
      addressAndPrivateKeyLookup[ourIndex].privateKey,
    ),
  ]);
};

const ledger9Update = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  protocolLocator: CHANNEL_SYNC_PROTOCOL_LOCATOR,
});
const ledger8Update = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger6, threePlayerLedger7, threePlayerLedger9],
  protocolLocator: CHANNEL_SYNC_PROTOCOL_LOCATOR,
});
const ledger7Update = commitmentsReceived({
  processId,
  signedCommitments: [threePlayerLedger6, threePlayerLedger7],
  protocolLocator: CHANNEL_SYNC_PROTOCOL_LOCATOR,
});

const waitForUpdate = updatesLeft =>
  states.waitForUpdate({ processId, channelId: threeWayLedgerId, updatesLeft });
export const playerAHasLatest = {
  initialize: {
    channelId: threeWayLedgerId,
    processId,
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.A),
    reply: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  },
  waitForFirstUpdate: {
    state: waitForUpdate(2),
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.A),
    action: ledger8Update,
  },
  waitForSecondUpdate: {
    state: waitForUpdate(1),
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.A),
    action: ledger7Update,
    channelId: threeWayLedgerId,
    latestCommitment: threePlayerLedger9,
  },
};
export const playerAIsMissingCommitment = {
  initialize: {
    processId,
    channelId: threeWayLedgerId,
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.A),
    reply: [threePlayerLedger6, threePlayerLedger7, threePlayerLedger8],
  },
  waitForFirstUpdate: {
    state: waitForUpdate(2),
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.A),
    action: ledger7Update,
  },
  waitForSecondUpdate: {
    state: waitForUpdate(1),
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.A),
    action: ledger9Update,
    channelId: threeWayLedgerId,
    latestCommitment: threePlayerLedger9,
  },
};

export const playerBHasLatest = {
  initialize: {
    processId,
    channelId: threeWayLedgerId,
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.B),
  },
  waitForFirstUpdate: {
    state: waitForUpdate(3),
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.B),
    action: ledger8Update,
    reply: [threePlayerLedger7, threePlayerLedger8, threePlayerLedger9],
  },
  waitForSecondUpdate: {
    state: waitForUpdate(1),
    sharedData: ledger9ReceivedSharedData(ThreePartyPlayerIndex.B),
    action: ledger7Update,
    channelId: threeWayLedgerId,
    latestCommitment: threePlayerLedger9,
  },
};
export const playerBIsMissingCommitment = {
  initialize: {
    processId,
    channelId: threeWayLedgerId,
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.B),
  },
  waitForFirstUpdate: {
    state: waitForUpdate(3),
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.B),
    action: ledger7Update,
    reply: [threePlayerLedger6, threePlayerLedger7, threePlayerLedger8],
  },
  waitForSecondUpdate: {
    state: waitForUpdate(1),
    sharedData: ledger8ReceivedSharedData(ThreePartyPlayerIndex.B),
    action: ledger9Update,
    channelId: threeWayLedgerId,
    latestCommitment: threePlayerLedger9,
  },
};
