import { appCommitment, twoThree } from '../../../../domain/commitments/__tests__';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as scenarios from '../../../../domain/commitments/__tests__';
import { preSuccess as indirectFundingPreSuccess } from '../../indirect-funding/__tests__';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
// import * as states from '../states';
// import { threePlayerPreSuccessA as consensusUpdatePreSuccess } from '../../consensus-update/__tests__';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const { asAddress, asPrivateKey, threeParticipants: destination } = scenarios;

const app0 = appCommitment({ turnNum: 10, balances: twoThree, isFinal: true });
const app1 = appCommitment({ turnNum: 11, balances: twoThree, isFinal: true });
const appChannel = channelFromCommitments([app0, app1], asAddress, asPrivateKey);
const appChannelId = appChannel.channelId;
const hubAddress = destination[2];
const jointChannelId = indirectFundingPreSuccess.state.existingLedgerFundingState.ledgerId;

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

// const waitForJointChannelUpdate = states.waitForJointChannelUpdate({
//   ...props,
//   jointChannel: consensusUpdatePreSuccess.state,
// });

export const happyPath = {
  ...props,
};
