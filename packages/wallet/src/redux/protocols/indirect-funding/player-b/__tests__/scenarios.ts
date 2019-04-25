import { bigNumberify } from 'ethers/utils';
import * as globalActions from '../../../../actions';
import { CommitmentType } from 'fmg-core/lib/commitment';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator';
import { channelID } from 'fmg-core/lib/channel';
import { SignedCommitment } from '../../../../channel-state/shared/state';
import { signCommitment } from '../../../../../utils/signing-utils';
import {
  bWaitForPreFundSetup0,
  bWaitForDirectFunding,
  bWaitForLedgerUpdate0,
  bWaitForPostFundSetup0,
} from '../state';
import {
  ChannelStatus,
  waitForUpdate,
  waitForFundingAndPostFundSetup,
} from '../../../../channel-state/state';
import { SharedData, setChannel, EMPTY_SHARED_DATA } from '../../../../state';

import {
  preSuccessStateB,
  successTriggerB,
  preFailureState,
  failureTrigger,
} from '../../../direct-funding/__tests__';

// -----------
// Commitments
// -----------
export const libraryAddress = '0x' + '1'.repeat(40);
export const ledgerLibraryAddress = '0x' + '2'.repeat(40);
export const channelNonce = 4;
export const asPrivateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
export const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
export const bsPrivateKey = '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72';
export const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';
export const participants: [string, string] = [asAddress, bsAddress];
export const channel = { channelType: libraryAddress, nonce: channelNonce, participants };
export const channelId = channelID(channel);
export const processId = 'processId';

const LEDGER_CHANNEL_NONCE = 0;
export const ledgerChannel = {
  nonce: LEDGER_CHANNEL_NONCE,
  channelType: ledgerLibraryAddress,
  participants,
};
const ledgerId = channelID(ledgerChannel);

interface Balance {
  address: string;
  wei: string;
}

const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];

const fiveToApp = [{ address: channelId, wei: bigNumberify(5).toHexString() }];

const app0 = appState({ turnNum: 0, balances: twoThree });
const app1 = appState({ turnNum: 1, balances: twoThree });
const app2 = appState({ turnNum: 2, balances: twoThree });
const app3 = appState({ turnNum: 3, balances: twoThree });

const ledger0 = ledgerState({ turnNum: 0, balances: twoThree });
const ledger1 = ledgerState({ turnNum: 1, balances: twoThree });
const ledger2 = ledgerState({ turnNum: 2, balances: twoThree });
const ledger3 = ledgerState({ turnNum: 3, balances: twoThree });
const ledger4 = ledgerState({ turnNum: 4, balances: twoThree, proposedBalances: fiveToApp });
const ledger5 = ledgerState({ turnNum: 5, balances: fiveToApp });

// Channels
function channelFromCommitments(
  penultimateCommitment: SignedCommitment,
  lastCommitment: SignedCommitment,
): ChannelStatus {
  const { turnNum, channel: thisChannel } = lastCommitment.commitment;
  let funded = true;
  if (turnNum <= 1) {
    funded = false;
  }
  let channelConstructor;
  if (turnNum === 1 || turnNum === 2) {
    channelConstructor = waitForFundingAndPostFundSetup;
  } else {
    channelConstructor = waitForUpdate;
  }

  return channelConstructor({
    channelId: channelID(thisChannel),
    libraryAddress,
    channelNonce: lastCommitment.commitment.channel.nonce,
    funded,
    participants,
    address: bsAddress,
    privateKey: bsPrivateKey,
    ourIndex: 1,
    turnNum,
    lastCommitment,
    penultimateCommitment,
  });
}

function setChannels(store: SharedData, channels: ChannelStatus[]): SharedData {
  return channels.reduce((st, ch) => setChannel(st, ch), store);
}

const props = { channelId, ledgerId };

// ------
// States
// ------
const waitForPreFundL0 = {
  state: bWaitForPreFundSetup0(props),
  store: setChannels(EMPTY_SHARED_DATA, [channelFromCommitments(app0, app1)]),
};
const waitForDirectFunding = {
  state: bWaitForDirectFunding({ ...props, directFundingState: preSuccessStateB.protocolState }), //
  store: setChannels(preSuccessStateB.sharedData, [
    channelFromCommitments(app0, app1),
    channelFromCommitments(ledger0, ledger1),
  ]),
};
const waitForLedgerUpdate0 = {
  state: bWaitForLedgerUpdate0(props),
  store: setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app0, app1),
    channelFromCommitments(ledger2, ledger3),
  ]),
};
const waitForPostFund0 = {
  state: bWaitForPostFundSetup0(props),
  store: setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app0, app1),
    channelFromCommitments(ledger4, ledger5),
  ]),
};

const waitForDirectFundingFailure = {
  state: bWaitForDirectFunding({ ...props, directFundingState: preFailureState.protocolState }), //
  store: setChannels(preFailureState.sharedData, [
    channelFromCommitments(app0, app1),
    channelFromCommitments(ledger0, ledger1),
  ]), // should have app0, app1, ledger0, ledger1
};

// -------
// Actions
// -------
const preFundL0Received = globalActions.commitmentReceived(
  processId,
  ledger0.commitment,
  ledger0.signature,
);
const ledgerUpdate0Received = globalActions.commitmentReceived(
  processId,
  ledger4.commitment,
  ledger4.signature,
);
const postFund0Received = globalActions.commitmentReceived(
  processId,
  app2.commitment,
  app2.signature,
);

export const happyPath = {
  initialParams: { store: waitForPreFundL0.store, channelId },
  waitForPreFundL0: { state: waitForPreFundL0, action: preFundL0Received, reply: ledger1 },
  waitForDirectFunding: { state: waitForDirectFunding, action: successTriggerB },
  waitForLedgerUpdate0: {
    state: waitForLedgerUpdate0,
    action: ledgerUpdate0Received,
    reply: ledger5,
  },
  waitForPostFund0: { state: waitForPostFund0, action: postFund0Received, reply: app3 },
};

export const ledgerFundingFails = {
  waitForDirectFunding: { state: waitForDirectFundingFailure, action: failureTrigger },
};

// -------
// Helpers
// -------

function typeAndCount(
  turnNum: number,
  isFinal: boolean,
): { commitmentCount: number; commitmentType: CommitmentType } {
  let commitmentCount;
  let commitmentType;
  if (isFinal) {
    commitmentCount = 0;
    commitmentType = CommitmentType.Conclude;
  } else if (turnNum < 2) {
    commitmentCount = turnNum;
    commitmentType = CommitmentType.PreFundSetup;
  } else if (turnNum < 4) {
    commitmentCount = turnNum - 2;
    commitmentType = CommitmentType.PostFundSetup;
  } else {
    commitmentType = CommitmentType.App;
    commitmentCount = 0;
  }
  return { commitmentCount, commitmentType };
}

interface AppStateParams {
  turnNum: number;
  isFinal?: boolean;
  balances?: Balance[];
  appAttributes?: string;
}

function appState(params: AppStateParams): SignedCommitment {
  const turnNum = params.turnNum;
  const balances = params.balances || twoThree;
  const isFinal = params.isFinal || false;
  const appAttributes = params.appAttributes || '0x0';
  const allocation = balances.map(b => b.wei);
  const destination = balances.map(b => b.address);
  const { commitmentCount, commitmentType } = typeAndCount(turnNum, isFinal);

  const commitment = {
    channel,
    commitmentCount,
    commitmentType,
    turnNum,
    appAttributes,
    allocation,
    destination,
  };
  const privateKey = turnNum % 2 === 0 ? asPrivateKey : bsPrivateKey;

  return { commitment, signature: signCommitment(commitment, privateKey) };
}

function ledgerAppAttributes(consensusCounter, balances: Balance[] = twoThree) {
  const proposedAllocation = balances.map(b => b.wei);
  const proposedDestination = balances.map(b => b.address);
  return bytesFromAppAttributes({
    proposedAllocation,
    proposedDestination,
    consensusCounter,
  });
}

interface LedgerStateParams {
  turnNum: number;
  isFinal?: boolean;
  balances?: Balance[];
  proposedBalances?: Balance[];
}

function ledgerState(params: LedgerStateParams): SignedCommitment {
  const turnNum = params.turnNum;
  const isFinal = params.isFinal || false;
  const balances = params.balances || twoThree;
  const proposedBalances = params.proposedBalances || balances;
  const consensusCounter = JSON.stringify(balances) === JSON.stringify(proposedBalances) ? 0 : 1;
  const allocation = balances.map(b => b.wei);
  const destination = balances.map(b => b.address);
  const { commitmentCount, commitmentType } = typeAndCount(turnNum, isFinal);
  const appAttributes = ledgerAppAttributes(consensusCounter, proposedBalances);
  const commitment = {
    channel: ledgerChannel,
    commitmentCount,
    commitmentType,
    turnNum,
    appAttributes,
    allocation,
    destination,
  };

  const privateKey = turnNum % 2 === 0 ? asPrivateKey : bsPrivateKey;

  return { commitment, signature: signCommitment(commitment, privateKey) };
}
