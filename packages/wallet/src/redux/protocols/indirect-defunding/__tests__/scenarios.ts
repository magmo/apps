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
import { waitForLedgerUpdate } from '../state';
import { setChannels, EMPTY_SHARED_DATA } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { bsPrivateKey } from '../../../../communication/__tests__/commitments';
// -----------
// Commitments
// -----------
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

const app10 = appCommitment({ turnNum: 10, balances: twoThree, isFinal: true });
const app11 = appCommitment({ turnNum: 11, balances: twoThree, isFinal: true });

const ledger4 = ledgerCommitment({ turnNum: 4, balances: twoThree, proposedBalances: fiveToApp });
const ledger5 = ledgerCommitment({ turnNum: 5, balances: fiveToApp });
const ledger6 = ledgerCommitment({ turnNum: 6, balances: fiveToApp, proposedBalances: twoThree });
// const ledger7 = ledgerCommitment({ turnNum: 7, balances: twoThree });

const playerAWaitForUpdate = {
  state: waitForLedgerUpdate(props),
  store: setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app10, app11, asAddress, asPrivateKey),
    channelFromCommitments(ledger4, ledger5, asAddress, asPrivateKey),
  ]),
};

const playerBWaitForUpdate = {
  state: waitForLedgerUpdate(props),
  store: setChannels(EMPTY_SHARED_DATA, [
    channelFromCommitments(app10, app11, bsAddress, bsPrivateKey),
    channelFromCommitments(ledger4, ledger5, bsAddress, bsPrivateKey),
  ]),
};

export const playerAHappyPath = {
  initialParams: {
    store: playerAWaitForUpdate.store,
    ...props,
    reply: ledger6,
  },
};

export const playerBHappyPath = {
  initialParams: {
    store: playerBWaitForUpdate.store,
    channelId,
    ledgerId,
    processId: 'processId',
  },
};
