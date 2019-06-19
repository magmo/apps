import * as states from '../states';
import { ThreePartyPlayerIndex } from '../../../types';

import { EMPTY_SHARED_DATA, setChannels } from '../../../state';
import { channelId } from '../../../../domain/commitments/__tests__';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import * as scenarios from '../../../__tests__/test-scenarios';
import { commitmentsReceived } from '../../../../communication';

// We will use 2 different scenarios:
//
// 1. NewChannelAsA: CommitmentSent
//                -> Success
//
// 2. ExistingChannelAsA: NotSafeToSend
//                     -> CommitmentSent
//                     -> Success
//
// 3. NewChannelAsB: CommitmentSent
//                -> Success
//
// 4. ExistingChannelAsB: NotSafeToSend
//                     -> CommitmentSent
//                     -> Success
//

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
} = scenarios;
const {
  signedCommitment0,
  signedCommitment1,
  signedCommitment2,
  signedCommitment3,
  signedCommitment4,
  signedCommitment5,
} = signedJointLedgerCommitments;

const props = {
  processId,
  channelId,
};

const propsA = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.A,
};

const propsB = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.B,
};

const propsHub = {
  ...props,
  ourIndex: ThreePartyPlayerIndex.Hub,
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
const commitmentSentA = states.commitmentSent(propsA);

const notSafeToSendB = states.notSafeToSend(propsB);
const commitmentSentB = states.commitmentSent(propsB);

const notSafeToSendHub = states.notSafeToSend(propsHub);

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

const hubSentPreFundCommitment = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments(commitments2, hubAddress, hubPrivateKey),
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

const action: any = '';
const aReceivesPreFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments2,
});
const aReceivesPostFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments5,
});

const bReceivesPreFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments0,
});
const bReceivesPostFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments3,
});

const hubReceivesPreFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments0,
});
const hubReceivesPostFundSetup = commitmentsReceived({
  processId,
  signedCommitments: commitments3,
});

// ---------
// Scenarios
// ---------

export const newChannelAsA = {
  ...propsA,
  commitmentSent: {
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    action: aReceivesPreFundSetup,
  },
};

export const existingChannelAsA = {
  ...propsA,
  commitmentSent: {
    state: commitmentSentA,
    sharedData: aSentPostFundCommitment,
    action: aReceivesPostFundSetup,
  },
};

export const newChannelAsB = {
  ...propsB,
  notSafeToSend: {
    state: notSafeToSendB,
    sharedData: emptySharedData,
    action: bReceivesPreFundSetup,
  },
  commitmentSent: {
    state: commitmentSentB,
    sharedData: bSentPreFundCommitment,
    action,
  },
};

export const existingChannelAsB = {
  ...propsB,

  notSafeToSend: {
    state: notSafeToSendB,
    sharedData: bSentPreFundCommitment,
    action: bReceivesPostFundSetup,
  },
  commitmentSent: {
    state: commitmentSentB,
    sharedData: bSentPostFundSetupCommitment,
    action,
  },
};

export const newChannelAsHuB = {
  ...propsHub,
  notSafeToSend: {
    state: notSafeToSendHub,
    sharedData: emptySharedData,
    action: hubReceivesPreFundSetup,
  },
};

export const existingChannelAsHuB = {
  ...propsHub,

  notSafeToSend: {
    state: notSafeToSendHub,
    sharedData: hubSentPreFundCommitment,
    action: hubReceivesPostFundSetup,
  },
};
