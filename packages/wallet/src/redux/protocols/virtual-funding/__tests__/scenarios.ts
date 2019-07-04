import * as states from '../states';

import { EMPTY_SHARED_DATA, setChannel } from '../../../state';
import * as scenarios from '../../../__tests__/test-scenarios';
import { CommitmentType } from '../../../../domain';
import { preFund, postFund } from '../../advance-channel/__tests__';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { appCommitment, twoThree } from '../../../../domain/commitments/__tests__';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const {
  asAddress,
  asPrivateKey,
  signedJointLedgerCommitments,
  threeParticipants: destination,
  ledgerLibraryAddress: channelType,
} = scenarios;
const { signedCommitment0 } = signedJointLedgerCommitments;
const appAttributes = signedCommitment0.commitment.appAttributes;

const app0 = appCommitment({ turnNum: 0, balances: twoThree });
const app1 = appCommitment({ turnNum: 1, balances: twoThree });
const appChannel = channelFromCommitments([app0, app1], asAddress, asPrivateKey);
const targetChannelId = appChannel.channelId;
const hubAddress = destination[2];

// To properly test the embedded advanceChannel protocols, it's useful to be playerA
// to make sure that the commitments get sent.

const startingAllocation = app0.commitment.allocation;
const startingDestination = app0.commitment.destination;

const initializeArgs = {
  startingAllocation,
  startingDestination,
  participants: destination,
  channelType,
  appAttributes,
  processId,
  clearedToSend: true,
  address: asAddress,
  privateKey: asPrivateKey,
  ourIndex: 0,
  commitmentType: CommitmentType.PreFundSetup,
  targetChannelId,
  hubAddress,
};

const props = {
  targetChannelId,
  processId,
  startingAllocation,
  startingDestination,
  hubAddress,
};

// ----
// States
// ------

const scenarioStates = {
  waitForJointChannel1: states.waitForJointChannel({
    ...props,
    jointChannel: preFund.preSuccess.state,
  }),
  waitForJointChannel2: states.waitForJointChannel({
    ...props,
    jointChannel: {
      ...preFund.preSuccess.state,
      commitmentType: CommitmentType.PostFundSetup,
    },
  }),

  waitForGuarantorChannel: states.waitForGuarantorChannel({
    ...props,
    guarantorChannel: preFund.success.state,
  }),
};

// -------
// Shared Data
// -------

// -------
// Actions
// -------

// ---------
// Scenarios
// ---------

export const happyPath = {
  ...props,
  initialize: {
    args: initializeArgs,
    sharedData: setChannel(EMPTY_SHARED_DATA, appChannel),
  },
  openJ: {
    state: scenarioStates.waitForJointChannel1,
    action: { ...preFund.preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(preFund.preSuccess.sharedData, appChannel),
  },
  prepareJ: {
    state: scenarioStates.waitForJointChannel2,
    action: { ...postFund.preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(postFund.preSuccess.sharedData, appChannel),
  },
  openG: {
    state: scenarioStates.waitForGuarantorChannel,
    action: { ...preFund.preSuccess.trigger, protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(preFund.preSuccess.sharedData, appChannel),
  },
  prepareG: {
    state: scenarioStates.waitForGuarantorChannel,
    action: {
      ...postFund.preSuccess.trigger,
      protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
    },
    sharedData: setChannel(postFund.preSuccess.sharedData, appChannel),
  },
};
