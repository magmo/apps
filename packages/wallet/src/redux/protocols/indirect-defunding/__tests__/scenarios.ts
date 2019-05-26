import {
  appCommitment,
  ledgerCommitment,
  asAddress,
  bsAddress,
  asPrivateKey,
  ledgerId,
  channelId,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils/bignumber';
import { waitForLedgerUpdate, confirmLedgerUpdate } from '../states';
import { setChannels, EMPTY_SHARED_DATA, SharedData } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { bsPrivateKey } from '../../../../communication/__tests__/commitments';
import * as globalActions from '../../../actions';
import { updateConfirmed } from '../actions';
import { CommitmentType } from 'fmg-core';

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

// -----------
// Commitments
// -----------

const app9 = appCommitment({ turnNum: 9, balances: twoThree, isFinal: false });
export const app10 = appCommitment({ turnNum: 10, balances: twoThree, isFinal: true });
export const app11 = appCommitment({ turnNum: 11, balances: twoThree, isFinal: true });

export const ledger4 = ledgerCommitment({
  turnNum: 4,
  balances: twoThree,
  proposedBalances: fiveToApp,
});
export const ledger5 = ledgerCommitment({ turnNum: 5, balances: fiveToApp });
const ledger6 = ledgerCommitment({ turnNum: 6, balances: fiveToApp, proposedBalances: twoThree });
export const ledger7 = ledgerCommitment({ turnNum: 7, balances: twoThree });
const ledger8 = ledgerCommitment({ turnNum: 8, balances: twoThree, isFinal: true });
const ledger9 = ledgerCommitment({ turnNum: 9, balances: twoThree, isFinal: true });

// -----------
// States
// -----------

export const setFundingState = (sharedData: SharedData): SharedData => {
  return {
    ...sharedData,
    fundingState: { [channelId]: { directlyFunded: false, fundingChannel: ledgerId } },
  };
};
const initialStore = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app10, app11, asAddress, asPrivateKey),
    channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
  ]),
);

const notDefundableInitialStore = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app9, app10, asAddress, asPrivateKey),
    channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
  ]),
);

const playerAConfirmLedgerUpdate0 = {
  state: confirmLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger5, ledger6, asAddress, asPrivateKey),
    ]),
  ),
};
const playerAWaitForUpdate = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger5, ledger6, asAddress, asPrivateKey),
    ]),
  ),
};

const playerAConfirmConclude = {
  state: confirmLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger7, ledger8, asAddress, asPrivateKey),
    ]),
  ),
};
const playerAWaitForConclude = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger7, ledger8, asAddress, asPrivateKey),
    ]),
  ),
};

const playerBWaitForUpdate = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
      channelFromCommitments(ledger4, ledger5, bsAddress, bsPrivateKey),
    ]),
  ),
};

const playerBWaitForConclude = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
      channelFromCommitments(ledger6, ledger7, bsAddress, bsPrivateKey),
    ]),
  ),
};

// -----------
// Actions
// -----------
const ledgerUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.App,
  signedCommitment: ledger6,
});
const concludeUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.Conclude,
  signedCommitment: ledger8,
});

export const ledgerUpdate0Received = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger6,
});
const ledgerUpdate1Received = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger7,
});
const conclude0Received = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger8,
});
const conclude1Received = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger9,
});
// const invalidLedgerUpdateReceived = globalActions.commitmentReceived({
//   processId,
//   signedCommitment: ledger5,
// });
// -----------
// Scenarios
// -----------
export const playerAHappyPath = {
  initialParams: {
    store: initialStore,
    ...props,
  },
  confirmLedgerUpdate0: {
    state: playerAConfirmLedgerUpdate0,
    action: ledgerUpdateConfirmed,
    reply: ledger6,
  },
  waitForLedgerUpdate1: {
    state: playerAWaitForUpdate,
    action: ledgerUpdate1Received,
  },
  confirmConclude: {
    state: playerAConfirmConclude,
    action: concludeUpdateConfirmed,
    reply: ledger8,
  },
  waitForConclude: {
    state: playerAWaitForConclude,
    action: conclude1Received,
  },
};

// export const playerAInvalidCommitment = {
//   waitForLedgerUpdate: { state: playerAWaitForUpdate, action: invalidLedgerUpdateReceived },
// };
// export const playerBInvalidCommitment = {
//   waitForLedgerUpdate: { state: playerBWaitForUpdate, action: invalidLedgerUpdateReceived },
// };

export const playerBHappyPath = {
  initialParams: {
    store: initialStore,
    ...props,
  },
  waitForLedgerUpdate0: {
    state: playerBWaitForUpdate,
    action: ledgerUpdate0Received,
    reply: ledger7,
  },
  confirmLedgerUpdate1: {
    state: {},
    action: {},
    reply: ledger7,
  },
  waitForConclude: {
    state: playerBWaitForConclude,
    action: conclude0Received,
  },
  confirmConclude: {
    state: {},
    action: {},
    reply: ledger9,
  },
};

export const notDefundable = {
  initialParams: {
    store: notDefundableInitialStore,
    ...props,
  },
};
