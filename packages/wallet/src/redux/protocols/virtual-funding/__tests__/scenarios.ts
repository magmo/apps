import * as states from '../states';

import { CommitmentType } from '../../../../domain';
import { appCommitment, twoThree } from '../../../../domain/commitments/__tests__';
import * as scenarios from '../../../__tests__/test-scenarios';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { EMPTY_SHARED_DATA, setChannel } from '../../../state';
import { preSuccess, success } from '../../advance-channel/__tests__';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const {
  asAddress,
  asPrivateKey,
  signedJointLedgerCommitments,
  threeParticipants: destination,
  oneTwoThree: allocation,
  ledgerLibraryAddress: channelType,
} = scenarios;
const { signedCommitment0 } = signedJointLedgerCommitments;
const appAttributes = signedCommitment0.commitment.appAttributes;

const app0 = appCommitment({ turnNum: 0, balances: twoThree });
const app1 = appCommitment({ turnNum: 1, balances: twoThree });
const appChannel = channelFromCommitments([app0, app1], asAddress, asPrivateKey);
const targetChannelId = appChannel.channelId;

// To properly test the embedded advanceChannel protocols, it's useful to be playerA
// to make sure that the commitments get sent.
const initializeArgs = {
  startingAllocation: allocation,
  startingDestination: destination,
  channelType,
  appAttributes,
  processId,
  clearedToSend: true,
  address: asAddress,
  privateKey: asPrivateKey,
  ourIndex: 0,
  commitmentType: CommitmentType.PreFundSetup,
  targetChannelId,
};

const props = {
  targetChannelId,
  processId,
};

// ----
// States
// ------

const scenarioStates = {
  waitForChannelPreparation: states.waitForChannelPreparation({
    ...props,
    [states.JOINT_CHANNEL_DESCRIPTOR]: preSuccess.state,
    [states.GUARANTOR_CHANNEL_DESCRIPTOR]: preSuccess.state,
  }),

  waitForChannelPreparationJ: states.waitForChannelPreparation({
    ...props,
    [states.JOINT_CHANNEL_DESCRIPTOR]: preSuccess.state,
    [states.GUARANTOR_CHANNEL_DESCRIPTOR]: success.state,
  }),

  waitForChannelPreparationG: states.waitForChannelPreparation({
    ...props,
    [states.JOINT_CHANNEL_DESCRIPTOR]: success.state,
    [states.GUARANTOR_CHANNEL_DESCRIPTOR]: preSuccess.state,
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
  openJFirst: {
    state: scenarioStates.waitForChannelPreparation,
    action: { ...preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: preSuccess.sharedData,
  },
  openGFirst: {
    state: scenarioStates.waitForChannelPreparation,
    action: { ...preSuccess.trigger, protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR },
    sharedData: preSuccess.sharedData,
  },
  openJSecond: {
    state: scenarioStates.waitForChannelPreparationJ,
    action: { ...preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: preSuccess.sharedData,
  },
  openGSecond: {
    state: scenarioStates.waitForChannelPreparationG,
    action: { ...preSuccess.trigger, protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR },
    sharedData: preSuccess.sharedData,
  },
};
