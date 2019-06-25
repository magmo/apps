import * as states from '../states';

import { EMPTY_SHARED_DATA } from '../../../state';
import * as scenarios from '../../../__tests__/test-scenarios';
import { CommitmentType } from '../../../../domain';
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
  jointLedgerId: targetChannelId,
} = scenarios;
const { signedCommitment0 } = signedJointLedgerCommitments;
const appAttributes = signedCommitment0.commitment.appAttributes;

const initializeArgs = {
  allocation,
  destination,
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
    sharedData: EMPTY_SHARED_DATA,
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
