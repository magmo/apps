import * as states from '../states';
import { ThreePartyPlayerIndex as PlayerIndex } from '../../../types';

import { EMPTY_SHARED_DATA, SharedData } from '../../../state';

import { statesReceived, EmbeddedProtocol } from '../../../../communication';
import { clearedToSend } from '../actions';
import { bigNumberify } from 'ethers/utils';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../../constants';
import { makeLocator } from '../..';
import * as scenarios from '../../../../domain/commitments/__tests__';

// ---------
// Test data
// ---------

const processId = 'Process.123';
const channelId = scenarios.THREE_PARTICIPANT_LEDGER_CHANNEL_ID;
const { asAddress, asPrivateKey, bsAddress, bsPrivateKey, hubAddress, hubPrivateKey } = scenarios;
const outcome = scenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
  { address: hubAddress, wei: bigNumberify(2).toHexString() },
]);
const signedState0 = scenarios.threeWayLedgerState({ turnNum: 0 });
const signedState1 = scenarios.threeWayLedgerState({ turnNum: 1 });
const signedState2 = scenarios.threeWayLedgerState({ turnNum: 2 });
const signedState3 = scenarios.threeWayLedgerState({ turnNum: 3 });
const signedState4 = scenarios.threeWayLedgerState({ turnNum: 4 });
const signedState5 = scenarios.threeWayLedgerState({ turnNum: 5 });
const signedState6 = scenarios.threeWayLedgerState({
  turnNum: 6,
  isFinal: true,
});
const signedState7 = scenarios.threeWayLedgerState({
  turnNum: 7,
  isFinal: true,
});
const signedState8 = scenarios.threeWayLedgerState({
  turnNum: 8,
  isFinal: true,
});
const appData = signedState0.state.appData;
const participants = signedState0.state.channel.participants;
const initializeArgs = {
  appDefinition: CONSENSUS_LIBRARY_ADDRESS,
  outcome,
  participants,
  chainId: '0x1',
  ourAddress: asAddress,
  privateKey: asPrivateKey,
  appData,
  processId,
  clearedToSend: true,
  challengeDuration: '0x1',
  protocolLocator: makeLocator(EmbeddedProtocol.AdvanceChannel),
};

const props = {
  ...initializeArgs,
  channelId,
};

const propsA = {
  ...props,
  ourIndex: PlayerIndex.A,
};

const propsB = {
  ...props,
  ourIndex: PlayerIndex.B,
  privateKey: bsPrivateKey,
};

const propsHub = {
  ...props,
  ourIndex: PlayerIndex.Hub,
  privateKey: hubPrivateKey,
};

const signedStates0 = [signedState0];
const signedStates1 = [signedState0, signedState1];
const signedStates2 = [signedState0, signedState1, signedState2];
const signedStates3 = [signedState1, signedState2, signedState3];
const signedStates4 = [signedState2, signedState3, signedState4];
const signedStates5 = [signedState3, signedState4, signedState5];
const signedStates6 = [signedState4, signedState5, signedState6];
const signedStates7 = [signedState5, signedState6, signedState7];
const signedStates8 = [signedState6, signedState7, signedState8];

// ----
// States
// ------
const notSafeToSendA = states.notSafeToSend({
  ...propsA,
  stateType: states.StateType.PostFunding,
});
const commitmentSentA = states.stateSent({
  ...propsA,
  stateType: states.StateType.PreFunding,
});
const concludeCommitmentSentA = states.stateSent({
  ...propsA,
  stateType: states.StateType.Concluding,
});
const postFundCommitmentSentA = states.stateSent({
  ...propsA,
  stateType: states.StateType.PostFunding,
});

const waitingForConcludeB = states.notSafeToSend({
  ...propsB,
  stateType: states.StateType.Concluding,
});

const waitForConcludeHub = states.notSafeToSend({
  ...propsHub,
  stateType: states.StateType.Concluding,
});
const concludeCommitmentSentB = states.stateSent({
  ...propsB,
  stateType: states.StateType.Concluding,
});
const channelUnknownB = states.channelUnknown({
  ...propsB,
  stateType: states.StateType.PreFunding,
});
const notSafeToSendB = states.notSafeToSend({
  ...propsB,
  stateType: states.StateType.PreFunding,
});
const commitmentSentB = states.stateSent({
  ...propsB,
  stateType: states.StateType.PreFunding,
});

const channelUnknownHub = states.channelUnknown({
  ...propsHub,
  stateType: states.StateType.PreFunding,
});
const notSafeToSendHub = states.notSafeToSend({
  ...propsHub,
  stateType: states.StateType.PreFunding,
});

// -------
// Shared Data
// -------

const emptySharedData = { ...EMPTY_SHARED_DATA };
// const channelCreated = { ...EMPTY_SHARED_DATA };
const aSentPreFundCommitment = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates0),
]);

const bSentPreFundCommitment = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates1),
]);

const bReceivedPreFundSetup = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates2),
]);

const hubSentPreFundCommitment = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates2),
]);

const aReceivedPrefundSetup = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates2),
]);
const aSentPostFundCommitment = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates3),
]);

const bSentPostFundSetupCommitment = scenarios.setChannels(EMPTY_SHARED_DATA, [
  scenarios.channelStateFromStates(signedStates4),
]);

const allPostFundSetupsReceived = (playerIndex: PlayerIndex): SharedData => {
  return scenarios.setChannels(EMPTY_SHARED_DATA, [
    scenarios.channelStateFromStates(signedStates5),
  ]);
};

const aSentConclude = (playerIndex: PlayerIndex): SharedData => {
  return scenarios.setChannels(EMPTY_SHARED_DATA, [
    scenarios.channelStateFromStates(signedStates6),
  ]);
};
const bSentConclude = (playerIndex: PlayerIndex): SharedData => {
  return scenarios.setChannels(EMPTY_SHARED_DATA, [
    scenarios.channelStateFromStates(signedStates7),
  ]);
};

const allConcludesReceived = (playerIndex: PlayerIndex): SharedData => {
  return scenarios.setChannels(EMPTY_SHARED_DATA, [
    scenarios.channelStateFromStates(signedStates8),
  ]);
};

// -------
// Actions
// -------

const args = {
  processId,
  protocolLocator: makeLocator(EmbeddedProtocol.AdvanceChannel),
};

const receivePreFundSetupFromA = statesReceived({
  ...args,
  signedStates: signedStates0,
});
const receivePreFundSetupFromB = statesReceived({
  ...args,
  signedStates: signedStates1,
});
const receivePreFundSetupFromHub = statesReceived({
  ...args,
  signedStates: signedStates2,
});

const receivePostFundSetupFromA = statesReceived({
  ...args,
  signedStates: signedStates3,
});
const receivePostFundSetupFromB = statesReceived({
  ...args,
  signedStates: signedStates4,
});
const receivePostFundSetupFromHub = statesReceived({
  ...args,
  signedStates: signedStates5,
});
const receiveConcludeFromA = statesReceived({
  ...args,
  signedStates: signedStates6,
});
const receiveConcludeFromB = statesReceived({
  ...args,
  signedStates: signedStates7,
});
const receiveConcludeFromHub = statesReceived({
  ...args,
  signedStates: signedStates8,
});
const clearSending = clearedToSend({
  processId,
  protocolLocator: [],
});
// ---------
// Scenarios
// ---------
const initializeArgsA = {
  ...initializeArgs,
  address: asAddress,
  privateKey: asPrivateKey,
  ourIndex: PlayerIndex.A,
  stateType: states.StateType.PreFunding,
};

const initializeArgsB = {
  ...initializeArgs,
  address: bsAddress,
  privateKey: bsPrivateKey,
  ourIndex: PlayerIndex.B,
  stateType: states.StateType.PreFunding,
};

const initializeArgsHub = {
  ...initializeArgs,
  address: hubAddress,
  privateKey: hubPrivateKey,
  ourIndex: PlayerIndex.Hub,
  stateType: states.StateType.PreFunding,
};

const existingArgs = {
  clearedToSend: true,
  channelId,
  processId,
  stateType: states.StateType.PostFunding,
  protocolLocator: makeLocator(EmbeddedProtocol.AdvanceChannel),
};

const existingArgsA = { ...existingArgs, ourIndex: PlayerIndex.A };
const existingArgsB = { ...existingArgs, ourIndex: PlayerIndex.B };
const existingArgsHub = { ...existingArgs, ourIndex: PlayerIndex.Hub };

export const initialized = {
  ...propsA,
  state: commitmentSentA,
  sharedData: aSentPreFundCommitment,
  trigger: receivePreFundSetupFromHub,
};

export const preFund = {
  preSuccess: {
    ...propsA,
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    trigger: receivePreFundSetupFromHub,
  },
  success: {
    ...propsA,
    state: states.success({
      stateType: states.StateType.PreFunding,
      channelId,
    }),
    sharedData: aReceivedPrefundSetup,
  },
};
export const postFund = {
  preSuccess: {
    ...propsA,
    state: postFundCommitmentSentA,
    sharedData: aSentPostFundCommitment,
    trigger: receivePostFundSetupFromHub,
  },
  success: {
    ...propsA,
    state: states.success({
      stateType: states.StateType.PreFunding,
      channelId,
    }),
    sharedData: aReceivedPrefundSetup,
  },
};
export const conclude = {
  preSuccess: {
    state: concludeCommitmentSentA,
    sharedData: bSentConclude(PlayerIndex.A),
    trigger: receiveConcludeFromHub,
  },
  success: {
    ...propsA,
    state: states.success({
      stateType: states.StateType.Concluding,
      channelId,
    }),
    sharedData: allConcludesReceived,
  },
};
export const newChannelAsA = {
  ...propsA,
  initialize: {
    args: initializeArgsA,
    sharedData: emptySharedData,
    signedStates: signedStates0,
  },
  receiveFromB: {
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    action: receivePreFundSetupFromB,
    signedStates: signedStates1,
  },
  receiveFromHub: {
    state: commitmentSentA,
    sharedData: aSentPreFundCommitment,
    action: receivePreFundSetupFromHub,
    signedStates: signedStates2,
  },
};

export const existingChannelAsA = {
  ...propsA,
  stateType: states.StateType.PostFunding,
  initialize: {
    args: existingArgsA,
    sharedData: aReceivedPrefundSetup,
    signedStates: signedStates3,
  },
  receiveFromB: {
    state: { ...commitmentSentA, stateType: states.StateType.PostFunding },
    sharedData: aSentPostFundCommitment,
    action: receivePostFundSetupFromB,
    signedStates: signedStates4,
  },
  receiveFromHub: {
    state: { ...commitmentSentA, stateType: states.StateType.PostFunding },
    sharedData: aSentPostFundCommitment,
    action: receivePostFundSetupFromHub,
    signedStates: signedStates5,
  },
};

export const concludingAsA = {
  ...propsA,
  stateType: states.StateType.Concluding,
  initialize: {
    args: { ...existingArgsA, stateType: states.StateType.Concluding },
    sharedData: allPostFundSetupsReceived(PlayerIndex.A),
    signedStates: signedStates6,
  },
  receiveFromB: {
    state: concludeCommitmentSentA,
    sharedData: aSentConclude(PlayerIndex.A),
    action: receiveConcludeFromB,
    signedStates: signedStates7,
  },
  receiveFromHub: {
    state: concludeCommitmentSentA,
    sharedData: bSentConclude(PlayerIndex.A),
    action: receiveConcludeFromHub,
    signedStates: signedStates8,
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
    signedStates: signedStates1,
  },
  receiveFromHub: {
    state: commitmentSentB,
    sharedData: bSentPreFundCommitment,
    action: receivePreFundSetupFromHub,
    signedStates: signedStates2,
  },
};

export const existingChannelAsB = {
  ...propsB,
  stateType: states.StateType.PostFunding,
  initialize: {
    args: existingArgsB,
    sharedData: bReceivedPreFundSetup,
    signedStates: signedStates2,
  },
  receiveFromA: {
    state: { ...notSafeToSendB, stateType: states.StateType.PostFunding },
    sharedData: bSentPreFundCommitment,
    action: receivePostFundSetupFromA,
    signedStates: signedStates4,
  },
  receiveFromHub: {
    state: { ...commitmentSentB, stateType: states.StateType.PostFunding },
    sharedData: bSentPostFundSetupCommitment,
    action: receivePostFundSetupFromHub,
    signedStates: signedStates5,
  },
};
export const concludingAsB = {
  ...propsB,
  stateType: states.StateType.Concluding,
  initialize: {
    args: { ...existingArgsB, stateType: states.StateType.Concluding },
    sharedData: allPostFundSetupsReceived(PlayerIndex.B),
    signedStates: signedStates5,
  },
  receiveFromA: {
    state: waitingForConcludeB,
    sharedData: allPostFundSetupsReceived(PlayerIndex.B),
    action: receiveConcludeFromA,
    signedStates: signedStates7,
  },
  receiveFromHub: {
    state: concludeCommitmentSentB,
    sharedData: bSentConclude(PlayerIndex.B),
    action: receiveConcludeFromHub,
    signedStates: signedStates8,
  },
};

export const newChannelAsHub = {
  ...propsHub,
  initialize: {
    args: initializeArgsHub,
    sharedData: emptySharedData,
  },
  receiveFromA: {
    state: channelUnknownHub,
    sharedData: emptySharedData,
    action: receivePreFundSetupFromA,
    signedStates: signedStates0,
  },
  receiveFromB: {
    state: channelUnknownHub,
    sharedData: emptySharedData,
    action: receivePreFundSetupFromB,
    signedStates: signedStates2,
  },
};

export const existingChannelAsHub = {
  ...propsHub,
  stateType: states.StateType.PostFunding,
  initialize: {
    args: existingArgsHub,
    sharedData: hubSentPreFundCommitment,
    signedStates: signedStates2,
  },
  receiveFromB: {
    state: { ...notSafeToSendHub, stateType: states.StateType.PostFunding },
    sharedData: hubSentPreFundCommitment,
    action: receivePostFundSetupFromB,
    signedStates: signedStates5,
  },
};
export const concludingAsHub = {
  ...propsHub,
  stateType: states.StateType.Concluding,
  initialize: {
    args: { ...existingArgsB, stateType: states.StateType.Concluding },
    sharedData: allPostFundSetupsReceived(PlayerIndex.Hub),
    signedStates: signedStates5,
  },
  receiveFromA: {
    state: waitForConcludeHub,
    sharedData: allPostFundSetupsReceived(PlayerIndex.Hub),
    action: receiveConcludeFromA,
    signedStates: signedStates6,
  },
  receiveFromB: {
    state: waitForConcludeHub,
    sharedData: aSentConclude(PlayerIndex.Hub),
    action: receiveConcludeFromB,
    signedStates: signedStates8,
  },
};

export const notClearedToSend = {
  ...propsA,
  stateType: states.StateType.PostFunding,
  initialize: {
    args: { ...existingArgsA, clearedToSend: false },
    sharedData: aReceivedPrefundSetup,
    signedStates: signedStates2,
  },
  clearedToSend: {
    state: {
      ...notSafeToSendA,
      stateType: states.StateType.PostFunding,
      clearedToSend: false,
    },
    sharedData: aReceivedPrefundSetup,
    action: clearSending,
    signedStates: signedStates3,
  },
  clearedToSendButUnsafe: {
    state: {
      ...notSafeToSendB,
      stateType: states.StateType.PostFunding,
      clearedToSend: false,
    },
    sharedData: bSentPreFundCommitment,
    action: clearSending,
    signedStates: signedStates1,
  },
  clearedToSendButChannelUnknown: {
    state: {
      ...channelUnknownB,
      stateType: states.StateType.PreFunding,
      clearedToSend: false,
    },
    sharedData: emptySharedData,
    action: clearSending,
  },
  clearedToSendAndAlreadySent: {
    state: {
      ...commitmentSentB,
      stateType: states.StateType.PreFunding,
      clearedToSend: true,
    },
    sharedData: bSentPreFundCommitment,
    action: clearSending,
    signedStates: signedStates1,
  },
};
