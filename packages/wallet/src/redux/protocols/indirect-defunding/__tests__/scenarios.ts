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
import {
  waitForLedgerUpdate,
  confirmLedgerUpdate,
  acknowledgeLedgerFinalizedOffChain,
} from '../states';
import { setChannels, EMPTY_SHARED_DATA, SharedData } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { bsPrivateKey } from '../../../../communication/__tests__/commitments';
import * as globalActions from '../../../actions';
import { updateConfirmed, acknowledged } from '../actions';
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

const initialStoreA = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments([app10, app11], asAddress, asPrivateKey),
    channelFromCommitments([ledger4, ledger5], asAddress, asPrivateKey),
  ]),
);

const initialStoreB = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
    channelFromCommitments(ledger4, ledger5, bsAddress, bsPrivateKey),
  ]),
);

const notDefundableInitialStore = setFundingState(
  setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments([app9, app10], asAddress, asPrivateKey),
    channelFromCommitments([ledger4, ledger5], asAddress, asPrivateKey),
  ]),
);

export const playerAConfirmLedgerUpdate0 = {
  state: confirmLedgerUpdate({
    ...props,
    commitmentType: CommitmentType.App,
    isRespondingToChallenge: false,
  }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
    ]),
  ),
};
const playerAWaitForUpdate = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments([app10, app11], asAddress, asPrivateKey),
      channelFromCommitments([ledger5, ledger6], asAddress, asPrivateKey),
    ]),
  ),
};

const playerAConfirmConclude = {
  state: confirmLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger6, ledger7, asAddress, asPrivateKey),
    ]),
  ),
};
const playerAWaitForConclude = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments([app10, app11], asAddress, asPrivateKey),
      channelFromCommitments([ledger7, ledger8], asAddress, asPrivateKey),
    ]),
  ),
};

const AcknowledgeLedgerFinalizedOffChain = {
  state: acknowledgeLedgerFinalizedOffChain({ ...props }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, asAddress, asPrivateKey),
      channelFromCommitments(ledger8, ledger9, asAddress, asPrivateKey),
    ]),
  ),
};

export const playerBWaitForUpdate = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments([app10, app11], bsAddress, bsPrivateKey),
      channelFromCommitments([ledger4, ledger5], bsAddress, bsPrivateKey),
    ]),
  ),
};

const playerBConfirmLedgerUpdate1 = {
  state: confirmLedgerUpdate({ ...props, commitmentType: CommitmentType.App }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
      channelFromCommitments(ledger5, ledger6, bsAddress, bsPrivateKey),
    ]),
  ),
};

const playerBWaitForConclude = {
  state: waitForLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments([app10, app11], bsAddress, bsPrivateKey),
      channelFromCommitments([ledger6, ledger7], bsAddress, bsPrivateKey),
    ]),
  ),
};

const playerBConfirmConclude = {
  state: confirmLedgerUpdate({ ...props, commitmentType: CommitmentType.Conclude }),
  store: setFundingState(
    setChannels(EMPTY_SHARED_DATA, [
      channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
      channelFromCommitments(ledger7, ledger8, bsAddress, bsPrivateKey),
    ]),
  ),
};

// -----------
// Actions
// -----------
const playerALedgerUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.App,
});
const playerAConcludeUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.Conclude,
});

export const ledgerUpdate0Received = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger6,
});
const playerALedgerUpdate1Received = globalActions.commitmentReceived({
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
const invalidLedgerUpdateReceived = globalActions.commitmentReceived({
  processId,
  signedCommitment: ledger5,
});

const playerBLedgerUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.App,
  // signedCommitment: ledger7,
});

const playerBConcludeUpdateConfirmed = updateConfirmed({
  ...props,
  commitmentType: CommitmentType.Conclude,
  // signedCommitment: ledger9,
});

// -----------
// Scenarios
// -----------
export const playerAHappyPath = {
  initialParams: {
    store: initialStoreA,
    ...props,
  },
  confirmLedgerUpdate0: {
    state: playerAConfirmLedgerUpdate0,
    action: playerALedgerUpdateConfirmed,
    reply: ledger6,
  },
  waitForLedgerUpdate1: {
    state: playerAWaitForUpdate,
    action: playerALedgerUpdate1Received,
  },
  confirmConclude: {
    state: playerAConfirmConclude,
    action: playerAConcludeUpdateConfirmed,
    reply: ledger8,
  },
  waitForConclude: {
    state: playerAWaitForConclude,
    action: conclude1Received,
  },
  acknowledgeLedgerFinalizedOffChain: {
    state: AcknowledgeLedgerFinalizedOffChain,
    action: acknowledged({ ...props }),
  },
};

export const playerAInvalidCommitment = {
  waitForLedgerUpdate: { state: playerAWaitForUpdate, action: invalidLedgerUpdateReceived },
};
export const playerBInvalidCommitment = {
  waitForLedgerUpdate: { state: playerBWaitForUpdate, action: invalidLedgerUpdateReceived },
};

export const playerBHappyPath = {
  initialParams: {
    store: initialStoreB,
    ...props,
  },
  waitForLedgerUpdate0: {
    state: playerBWaitForUpdate,
    action: ledgerUpdate0Received,
  },
  confirmLedgerUpdate1: {
    state: playerBConfirmLedgerUpdate1,
    action: playerBLedgerUpdateConfirmed,
    reply: ledger7,
  },
  waitForConclude: {
    state: playerBWaitForConclude,
    action: conclude0Received,
  },
  confirmConclude: {
    state: playerBConfirmConclude,
    action: playerBConcludeUpdateConfirmed,
    reply: ledger9,
  },
  acknowledgeLedgerFinalizedOffChain: {
    state: AcknowledgeLedgerFinalizedOffChain,
    action: acknowledged({ ...props }),
  },
};

export const notDefundable = {
  initialParams: {
    store: notDefundableInitialStore,
    ...props,
  },
};
