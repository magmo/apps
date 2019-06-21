import * as states from '../states';
import { ThreePartyPlayerIndex } from '../../../types';

import { EMPTY_SHARED_DATA, setChannels } from '../../../state';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as scenarios from '../../../__tests__/test-scenarios';
import { commitmentsReceived } from '../../../../communication';
import { CommitmentType } from '../../../../domain';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const {
  asAddress,
  asPrivateKey,
  bsAddress,
  bsPrivateKey,
  hubAddress,
  hubPrivateKey,
  signedJointLedgerCommitments,
  threeParticipants: destination,
  oneTwoThree: allocation,
  ledgerLibraryAddress: channelType,
  jointLedgerId: channelId,
} = scenarios;
const {
  signedCommitment0,
  signedCommitment1,
  signedCommitment2,
  signedCommitment3,
  signedCommitment4,
  signedCommitment5,
} = signedJointLedgerCommitments;
const appAttributes = signedCommitment0.commitment.appAttributes;

const initializeArgs = {
  allocation,
  destination,
  channelType,
  appAttributes,
  processId,
};

const props = {
  ...initializeArgs,
  channelId,
};

const propsA = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.A,
};

const propsB = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.B,
  privateKey: bsPrivateKey,
};

const propsHub = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.Hub,
  privateKey: hubPrivateKey,
};

const commitments0 = [signedCommitment0];
const commitments1 = [signedCommitment0, signedCommitment1];
const commitments2 = [signedCommitment0, signedCommitment1, signedCommitment2];
const commitments3 = [signedCommitment1, signedCommitment2, signedCommitment3];
const commitments4 = [signedCommitment2, signedCommitment3, signedCommitment4];
const commitments5 = [signedCommitment3, signedCommitment4, signedCommitment5];

// ----
// States
// ------
const commitmentSentA = states.commitmentSent({
  ...propsA,
  commitmentType: CommitmentType.PreFundSetup,
});

const channelUnknownB = states.channelUnknown({
  ...propsB,
  commitmentType: CommitmentType.PreFundSetup,
});
const notSafeToSendB = states.notSafeToSend({
  ...propsB,
  commitmentType: CommitmentType.PreFundSetup,
});
const commitmentSentB = states.commitmentSent({
  ...propsB,
  commitmentType: CommitmentType.PreFundSetup,
});

const channelUnknownHub = states.channelUnknown({
  ...propsHub,
  commitmentType: CommitmentType.PreFundSetup,
});
const notSafeToSendHub = states.notSafeToSend({
  ...propsHub,
  commitmentType: CommitmentType.PreFundSetup,
});

// -------
// Shared Data
// -------

const emptySharedData = { ...EMPTY_SHARED_DATA };
// const channelCreated = { ...EMPTY_SHARED_DATA };
const aSentPreFundCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments0, asAddress, asPrivateKey),
]);

const bSentPreFundCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments1, bsAddress, bsPrivateKey),
]);

const bReceivedPreFundSetup = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments2, bsAddress, bsPrivateKey),
]);

const hubSentPreFundCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments2, hubAddress, hubPrivateKey),
]);

const aReceivedPrefundSetup = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments2, asAddress, asPrivateKey),
]);
const aSentPostFundCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments3, asAddress, asPrivateKey),
]);

const bSentPostFundSetupCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments4, bsAddress, bsPrivateKey),
]);

// -------
// Actions
// -------

const receivePreFundSetupFromA = commitmentsReceived({
  processId,
  signedCommitments: commitments0,
});
const receivePreFundSetupFromB = commitmentsReceived({
  processId,
  signedCommitments: commitments1,
});
const receivePreFundSetupFromHub = commitmentsReceived({
  processId,
  signedCommitments: commitments2,
});

const receivePostFundSetupFromA = commitmentsReceived({
  processId,
  signedCommitments: commitments3,
});
const receivePostFundSetupFromB = commitmentsReceived({
  processId,
  signedCommitments: commitments4,
});
const receivePostFundSetupFromHub = commitmentsReceived({
  processId,
  signedCommitments: commitments5,
});
// ---------
// Scenarios
// ---------
const initializeArgsA = {
  ...initializeArgs,
  address: asAddress,
  privateKey: asPrivateKey,
  ourIndex: 0,
  commitmentType: CommitmentType.PreFundSetup,
};

const initializeArgsB = {
  ...initializeArgs,
  address: bsAddress,
  privateKey: bsPrivateKey,
  ourIndex: 1,
  commitmentType: CommitmentType.PreFundSetup,
};

const initializeArgsHub = {
  ...initializeArgs,
  address: hubAddress,
  privateKey: hubPrivateKey,
  ourIndex: 2,
  commitmentType: CommitmentType.PreFundSetup,
};

const existingArgs = {
  channelId,
  processId,
  commitmentType: CommitmentType.PostFundSetup,
};

const existingArgsA = { ...existingArgs, ourIndex: 0 };
const existingArgsB = { ...existingArgs, ourIndex: 1 };
const existingArgsHub = { ...existingArgs, ourIndex: 2 };

export const newChannelAsA = {
  ...propsA,
  initialize: {
    args: initializeArgsA,
    sharedData: emptySharedData,
    commitments: commitments0,
  },
  receiveFromB: {
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    action: receivePreFundSetupFromB,
    commitments: commitments1,
  },
  receiveFromHub: {
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    action: receivePreFundSetupFromHub,
    commitments: commitments2,
  },
};

export const existingChannelAsA = {
  ...propsA,
  commitmentType: CommitmentType.PostFundSetup,
  initialize: {
    args: existingArgsA,
    sharedData: aReceivedPrefundSetup,
    commitments: commitments3,
  },
  receiveFromB: {
    state: { ...commitmentSentA, commitmentType: CommitmentType.PostFundSetup },
    sharedData: aSentPostFundCommitment,
    action: receivePostFundSetupFromB,
    commitments: commitments4,
  },
  receiveFromHub: {
    state: { ...commitmentSentA, commitmentType: CommitmentType.PostFundSetup },
    sharedData: aSentPostFundCommitment,
    action: receivePostFundSetupFromHub,
    commitments: commitments5,
  },
};

export const newChannelAsB = {
  ...propsB,
  initialize: {
    args: initializeArgsB,
    sharedData: emptySharedData,
  },
  receiveFromA: {
    state: channelUnknownB,
    sharedData: emptySharedData,
    action: receivePreFundSetupFromA,
    commitments: commitments1,
  },
  receiveFromHub: {
    state: commitmentSentB,
    sharedData: bSentPreFundCommitment,
    action: receivePreFundSetupFromHub,
    commitments: commitments2,
  },
};

export const existingChannelAsB = {
  ...propsB,
  commitmentType: CommitmentType.PostFundSetup,
  initialize: {
    args: existingArgsB,
    sharedData: bReceivedPreFundSetup,
    commitments: commitments2,
  },
  receiveFromA: {
    state: { ...notSafeToSendB, commitmentType: CommitmentType.PostFundSetup },
    sharedData: bSentPreFundCommitment,
    action: receivePostFundSetupFromA,
    commitments: commitments4,
  },
  receiveFromHub: {
    state: { ...commitmentSentB, commitmentType: CommitmentType.PostFundSetup },
    sharedData: bSentPostFundSetupCommitment,
    action: receivePostFundSetupFromHub,
    commitments: commitments5,
  },
};

export const newChannelAsHub = {
  ...propsHub,
  initialize: {
    args: initializeArgsHub,
    sharedData: emptySharedData,
  },
  receiveFromB: {
    state: channelUnknownHub,
    sharedData: emptySharedData,
    action: receivePreFundSetupFromB,
    commitments: commitments2,
  },
};

export const existingChannelAsHub = {
  ...propsHub,
  commitmentType: CommitmentType.PostFundSetup,
  initialize: {
    args: existingArgsHub,
    sharedData: hubSentPreFundCommitment,
    commitments: commitments2,
  },
  receiveFromB: {
    state: { ...notSafeToSendHub, commitmentType: CommitmentType.PostFundSetup },
    sharedData: hubSentPreFundCommitment,
    action: receivePostFundSetupFromB,
    commitments: commitments5,
  },
};
