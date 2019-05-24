import {
  ledgerCommitment,
  asAddress,
  bsAddress,
  asPrivateKey,
  ledgerId,
  channelId,
  bsPrivateKey,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils/bignumber';
import { SharedData, EMPTY_SHARED_DATA, setChannels } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as states from '../states';
import * as globalActions from '../../../actions';

const processId = 'processId';

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];

const fiveToApp = [{ address: channelId, wei: bigNumberify(5).toHexString() }];
const props = {
  channelId,
  ledgerId,
  processId,
  proposedAllocation: twoThree.map(a => a.wei),
  proposedDestination: twoThree.map(a => a.address),
};

const setFundingState = (sharedData: SharedData): SharedData => {
  return {
    ...sharedData,
    fundingState: { [channelId]: { directlyFunded: false, fundingChannel: ledgerId } },
  };
};

// -----------
// Commitments
// -----------
const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoThree });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: twoThree });
const ledger6 = ledgerCommitment({ turnNum: 6, balances: twoThree, proposedBalances: fiveToApp });
const ledger7 = ledgerCommitment({ turnNum: 7, balances: fiveToApp });

// -----------
// Shared Data
// -----------
const initialPlayerALedgerSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
  ]),
);
const playerAFirstCommitmentReceived = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(ledger5, ledger6, asAddress, asPrivateKey),
  ]),
);

const initialPlayerBLedgerSharedData = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(ledger4, ledger5, bsAddress, bsPrivateKey),
  ]),
);

// -----------
// States
// -----------
const waitForLedgerUpdate = states.waitForLedgerUpdate(props);
// -----------
// Actions
// -----------
const ledgerUpdate0Received = globalActions.commitmentReceived(processId, ledger6);
const ledgerUpdate1Received = globalActions.commitmentReceived(processId, ledger7);
const invalidLedgerUpdateReceived = globalActions.commitmentReceived(processId, ledger5);

export const playerAFullyFundedHappyPath = {
  initialize: { sharedData: initialPlayerALedgerSharedData, ledgerId, channelId, reply: ledger6 },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate,
    sharedData: playerAFirstCommitmentReceived,
    action: ledgerUpdate1Received,
  },
};

export const playerBFullyFundedHappyPath = {
  initialize: { sharedData: initialPlayerBLedgerSharedData, ledgerId, channelId },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate,
    sharedData: initialPlayerBLedgerSharedData,
    action: ledgerUpdate0Received,
    reply: ledger7,
  },
};

export const playerAInvalidCommitment = {
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate,
    sharedData: playerAFirstCommitmentReceived,
    action: invalidLedgerUpdateReceived,
  },
};

export const playerBInvalidCommitment = {
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate,
    sharedData: initialPlayerBLedgerSharedData,
    action: invalidLedgerUpdateReceived,
  },
};
