import { appCommitment, twoThree } from '../../../../domain/commitments/__tests__';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as scenarios from '../../../../domain/commitments/__tests__';
import { preSuccess as indirectFundingPreSuccess } from '../../indirect-funding/__tests__';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import * as states from '../states';
import { threePlayerPreSuccessA as consensusUpdatePreSuccess } from '../../consensus-update/__tests__';
import { setChannel, EMPTY_SHARED_DATA, setFundingState } from '../../../state';
import _ from 'lodash';
import { bigNumberify } from 'ethers/utils/bignumber';

// ---------
// Test data
// ---------
const processId = 'Process.123';

const { asAddress, asPrivateKey, threeParticipants: destination } = scenarios;
const hubAddress = destination[2];
const twoTwo = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: hubAddress, wei: bigNumberify(2).toHexString() },
];

const app0 = appCommitment({ turnNum: 10, balances: twoThree, isFinal: true });
const app1 = appCommitment({ turnNum: 11, balances: twoThree, isFinal: true });
const ledger5 = scenarios.ledgerCommitment({ turnNum: 5, balances: twoTwo });
const ledger6 = scenarios.ledgerCommitment({ turnNum: 6, balances: twoTwo });
const ledgerChannel = channelFromCommitments([ledger5, ledger6], asAddress, asPrivateKey);
const ledgerId = ledgerChannel.channelId;
const appChannel = channelFromCommitments([app0, app1], asAddress, asPrivateKey);
const appChannelId = appChannel.channelId;

const jointChannelId = indirectFundingPreSuccess.state.existingLedgerFundingState.ledgerId;
const guarantorChannelId = '0x01';

const startingAllocation = app0.commitment.allocation;
const startingDestination = app0.commitment.destination;
const props = {
  appChannelId,
  processId,
  startingAllocation,
  startingDestination,
  hubAddress,
  ourIndex: PlayerIndex.A,
  protocolLocator: [],
  ourAddress: asAddress,
  jointChannelId,
};

// ----
// States
// ------
const waitForJointChannelUpdate = states.waitForJointChannelUpdate({
  ...props,
  jointChannel: consensusUpdatePreSuccess.state,
});
const waitForLedgerChannelUpdate = states.waitForLedgerChannelUpdate({
  ...props,
  ledgerChannel: consensusUpdatePreSuccess.state,
});

// ----
// Shared Data
// ------
const initialSharedData = _.merge(
  setFundingState(setChannel(EMPTY_SHARED_DATA, appChannel), appChannelId, {
    fundingChannel: jointChannelId,
    directlyFunded: false,
  }),
  indirectFundingPreSuccess.sharedData,
);

const inProgressSharedData = _.merge(
  setFundingState(consensusUpdatePreSuccess.sharedData, jointChannelId, {
    guarantorChannel: guarantorChannelId,
    directlyFunded: false,
  }),
  setFundingState(EMPTY_SHARED_DATA, guarantorChannelId, {
    fundingChannel: ledgerId,
    directlyFunded: false,
  }),
  setChannel(EMPTY_SHARED_DATA, appChannel),
  setChannel(EMPTY_SHARED_DATA, ledgerChannel),
);

export const happyPath = {
  ...props,
  initialize: {
    ...props,
    sharedData: initialSharedData,
  },
  waitForJointChannel: {
    state: waitForJointChannelUpdate,
    action: consensusUpdatePreSuccess.action,
    sharedData: inProgressSharedData,
  },
  waitForLedgerChannel: {
    state: waitForLedgerChannelUpdate,
    action: consensusUpdatePreSuccess.action,
    sharedData: inProgressSharedData,
  },
};
