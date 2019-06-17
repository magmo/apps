import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import * as globalActions from '../../../actions';
import { preSuccessA } from '../../direct-funding/__tests__';
import {
  ledgerCommitment,
  asPrivateKey,
  channelId,
  ledgerId,
  asAddress,
  bsAddress,
} from '../../../../domain/commitments/__tests__';
import { setChannels, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
// ---------
// Test data
// ---------

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];
const twoThreeAndOneOne = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: asAddress, wei: bigNumberify(1).toHexString() },
  { address: bsAddress, wei: bigNumberify(1).toHexString() },
];

const threeFour = [
  { address: asAddress, wei: bigNumberify(3).toHexString() },
  { address: bsAddress, wei: bigNumberify(4).toHexString() },
];

const processId = 'process-id.123';
const props = {
  processId,
  channelId,
  ledgerId,
  proposedAllocation: threeFour.map(a => a.wei),
  proposedDestination: threeFour.map(a => a.address),
};

const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoThree });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: twoThree });
const ledger6 = ledgerCommitment({
  turnNum: 6,
  balances: twoThree,
  proposedBalances: twoThreeAndOneOne,
});
const ledger7 = ledgerCommitment({ turnNum: 7, balances: twoThreeAndOneOne });
const ledger8 = ledgerCommitment({
  turnNum: 8,
  balances: twoThreeAndOneOne,
  proposedBalances: threeFour,
});
const ledger9 = ledgerCommitment({ turnNum: 9, balances: threeFour });
// ------
// States
// ------
const waitForPreTopUpUpdate = states.waitForPreTopUpLedgerUpdate(props);
const waitForPostTopUpUpdate = states.waitForPostTopUpLedgerUpdate(props);
const waitForDirectFundingForPlayerA = states.waitForDirectFunding({
  ...props,
  directFundingState: preSuccessA.state,
});

// ------
// Shared Data
// ------
const initialSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
]);

const preTopUpUpdate0ReceivedSharedData = {
  ...preSuccessA.sharedData,
  ...setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(ledger5, ledger6, asAddress, asPrivateKey),
  ]),
};
const postTopUpUpdate0ReceivedSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(ledger7, ledger8, asAddress, asPrivateKey),
]);

// ------
// Actions
// ------
const preTopUpUpdate0 = globalActions.commitmentReceived({ processId, signedCommitment: ledger6 });
const preTopUpUpdate1 = globalActions.commitmentReceived({ processId, signedCommitment: ledger7 });
const postTopUpUpdate0 = globalActions.commitmentReceived({ processId, signedCommitment: ledger8 });
const postTopUpUpdate1 = globalActions.commitmentReceived({ processId, signedCommitment: ledger9 });
const playerAFundingSuccess = preSuccessA.action;
export const playerABothPlayersTopUp = {
  initialize: {
    ...props,
    reply: ledger6,
    sharedData: initialSharedData,
  },
  waitForPreTopUpLedgerUpdate: {
    state: waitForPreTopUpUpdate,
    action: preTopUpUpdate1,
    sharedData: preTopUpUpdate0ReceivedSharedData,
  },
  waitForDirectFunding: {
    state: waitForDirectFundingForPlayerA,
    action: playerAFundingSuccess,
    sharedData: preTopUpUpdate0ReceivedSharedData,
    reply: postTopUpUpdate0,
  },
  waitForPostTopUpLedgerUpdate: {
    state: waitForPostTopUpUpdate,
    sharedData: postTopUpUpdate0ReceivedSharedData,
    action: postTopUpUpdate1,
  },
};

export const playerBBothPlayersTopUp = {
  initialize: {
    ...props,
    sharedData: initialSharedData,
  },
  waitForPreTopUpLedgerUpdate: {
    state: waitForPreTopUpUpdate,
    action: preTopUpUpdate0,
    sharedData: preTopUpUpdate0ReceivedSharedData,
    reply: preTopUpUpdate1,
  },
  waitForDirectFunding: {
    state: waitForDirectFundingForPlayerA,
    action: playerAFundingSuccess,
    sharedData: preTopUpUpdate0ReceivedSharedData,
  },
  waitForPostTopUpLedgerUpdate: {
    state: waitForPostTopUpUpdate,
    action: postTopUpUpdate0,
    sharedData: postTopUpUpdate0ReceivedSharedData,
    reply: postTopUpUpdate1,
  },
};
