import * as testScenarios from '../../../__tests__/test-scenarios';
import { bigNumberify } from 'ethers/utils';
import * as states from '../states';
import * as globalActions from '../../../actions';
import { preSuccessB, preSuccessA } from '../../direct-funding/__tests__';
import { ledgerCommitment, asPrivateKey } from '../../../../domain/commitments/__tests__';
import { setChannels, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
// ---------
// Test data
// ---------
const { channelId, ledgerId, asAddress, bsAddress } = testScenarios;
const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];
const threeThree = [
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: asAddress, wei: bigNumberify(3).toHexString() },
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
const ledger6 = ledgerCommitment({ turnNum: 6, balances: twoThree, proposedBalances: threeThree });
const ledger7 = ledgerCommitment({ turnNum: 7, balances: threeThree });
const ledger8 = ledgerCommitment({ turnNum: 8, balances: threeThree, proposedBalances: threeFour });
const ledger9 = ledgerCommitment({ turnNum: 9, balances: threeFour });
// ------
// States
// ------
const waitForLedgerUpdateForPlayerA = states.waitForLedgerUpdateForPlayerA(props);
const waitForLedgerUpdateForPlayerB = states.waitForLedgerUpdateForPlayerB(props);
const waitForDirectFundingForPlayerA = states.waitForDirectFundingForPlayerA({
  ...props,
  directFundingState: preSuccessA.state,
});
const waitForDirectFundingForPlayerB = states.waitForDirectFundingForPlayerA({
  ...props,
  directFundingState: preSuccessB.state,
});

// ------
// Shared Data
// ------
const initialSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
]);

const playerAUpdate0ReceivedSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(ledger5, ledger6, asAddress, asPrivateKey),
]);
const playerBUpdate0ReceivedSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(ledger7, ledger8, asAddress, asPrivateKey),
]);

// ------
// Actions
// ------
const playerAUpdate0 = globalActions.commitmentReceived({ processId, signedCommitment: ledger6 });
const playerAUpdate1 = globalActions.commitmentReceived({ processId, signedCommitment: ledger7 });
const playerBUpdate0 = globalActions.commitmentReceived({ processId, signedCommitment: ledger8 });
const playerBUpdate1 = globalActions.commitmentReceived({ processId, signedCommitment: ledger9 });
const playerAFundingSuccess = preSuccessA.action;
export const playerABothPlayersTopUp = {
  initialize: {
    ...props,
    reply: ledger6,
    sharedData: initialSharedData,
  },
  waitForLedgerUpdateForPlayerA: {
    state: waitForLedgerUpdateForPlayerA,
    action: playerAUpdate1,
    sharedData: playerAUpdate0ReceivedSharedData,
  },
  waitForDirectFundingForPlayerA: {
    state: waitForDirectFundingForPlayerA,
    action: playerAFundingSuccess,
    sharedData: playerAUpdate0ReceivedSharedData,
    reply: playerBUpdate0,
  },
  waitForLedgerUpdateForPlayerB: {
    state: waitForLedgerUpdateForPlayerB,
    sharedData: playerBUpdate0ReceivedSharedData,
    action: playerBUpdate1,
  },
  waitForDirectFundingForPlayerB: {
    state: waitForDirectFundingForPlayerB,
    sharedData: playerBUpdate0ReceivedSharedData,
    action: preSuccessB.action,
  },
};

export const playerBBothPlayersTopUp = {
  initialize: {
    ...props,
    sharedData: initialSharedData,
  },
  waitForLedgerUpdateForPlayerA: {
    state: waitForLedgerUpdateForPlayerA,
    action: playerAUpdate0,
    sharedData: playerAUpdate0ReceivedSharedData,
    reply: playerAUpdate1,
  },
  waitForDirectFundingForPlayerA: {
    state: waitForDirectFundingForPlayerA,
    action: playerAFundingSuccess,
    sharedData: playerAUpdate0ReceivedSharedData,
  },
  waitForLedgerUpdateForPlayerB: {
    state: waitForLedgerUpdateForPlayerB,
    sharedData: playerBUpdate0ReceivedSharedData,
    action: playerBUpdate0,
    reply: playerBUpdate1,
  },
  waitForDirectFundingForPlayerB: {
    state: waitForDirectFundingForPlayerB,
    sharedData: playerBUpdate0ReceivedSharedData,
    action: preSuccessB.action,
  },
};
