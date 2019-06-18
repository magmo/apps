import * as states from '../states';
import { PlayerIndex } from '../../../types';

import { EMPTY_SHARED_DATA } from '../../../state';
import { channelId } from '../../../../domain/commitments/__tests__';

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
const processId = 'process-id.123';

const props = {
  processId,
  channelId,
};

const propsA = {
  ...props,
  ourIndex: PlayerIndex.A,
};

const propsB = {
  ...props,
  ourIndex: PlayerIndex.B,
};
// ----
// States
// ------
const commitmentSentA = states.commitmentSent(propsA);
const notSafeToSendB = states.notSafeToSend(propsB);
const commitmentSentB = states.commitmentSent(propsB);

// -------
// Shared Data
// -------

const emptySharedData = { ...EMPTY_SHARED_DATA };
const channelCreated = { ...EMPTY_SHARED_DATA };
const channelExists = { ...EMPTY_SHARED_DATA };
const channelUpdated = { ...EMPTY_SHARED_DATA };
// -------
// Actions
// -------

const action: any = '';

// ---------
// Scenarios
// ---------
export const newChannelAsA = {
  ...propsA,
  commitmentSent: {
    state: commitmentSentA,
    sharedData: channelCreated,
    action,
  },
};

export const existingChannelAsA = {
  ...propsA,

  commitmentSent: {
    state: commitmentSentA,
    sharedData: channelUpdated,
    action,
  },
};

export const newChannelAsB = {
  ...propsB,
  notSafeToSend: {
    state: notSafeToSendB,
    sharedData: emptySharedData,
    action,
  },
  commitmentSent: {
    state: commitmentSentB,
    sharedData: channelCreated,
    action,
  },
};

export const existingChannelAsB = {
  ...propsB,

  notSafeToSend: {
    state: notSafeToSendB,
    sharedData: channelExists,
    action,
  },
  commitmentSent: {
    state: commitmentSentB,
    sharedData: channelUpdated,
    action,
  },
};
