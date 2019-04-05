import * as walletStates from '../redux/state';
import * as channelStates from '../redux/channel-state/state';
import * as fundingStates from '../redux/channel-state/funding/state';
import * as sharedStates from '../redux/channel-state/shared/state';

import { defaultParams } from './dummy-wallet-states';

import { EMPTY_OUTBOX_STATE } from '../redux/outbox/state';

import { bsAddress, bsPrivateKey } from '../redux/__tests__/test-scenarios';

const { channelId, libraryAddress, participants } = defaultParams;

import {
  waitForApproval,
  waitForPreFundSetup0,
  waitForLedgerUpdate0,
  waitForPostFundSetup0,
} from '../redux/indirect-funding/player-b/state';

export const playerBDefaults = {
  ...defaultParams,
  ourIndex: 0,
  address: bsAddress,
  privateKey: bsPrivateKey,
};

/////////////////////
// DEFAULT OBJECTS //
/////////////////////

// const defaultFundingState: fundingStates.DirectFundingStatus = {
//     fundingType: fundingStates.DIRECT_FUNDING,
//     requestedTotalFunds: TOTAL_CONTRIBUTION,
//     requestedYourContribution: YOUR_CONTRIBUTION,
//     channelId: 'channel id',
//     ourIndex: 0,
//     safeToDepositLevel: YOUR_CONTRIBUTION,
//     depositStatus: fundingStates.depositing.WAIT_FOR_TRANSACTION_SENT,
//     channelFundingStatus: fundingStates.NOT_SAFE_TO_DEPOSIT,
// };

// const playerADefaults = {
// ...defaultParams,
// ourIndex: 0,
// fundingState: channelFunded(defaultFundingState),
// address: asAddress,
// };

const defaultInitializedChannelStatus: channelStates.InitializingChannelStatus = {
  address: '',
  privateKey: '',
};

const defaultInitializingChannelState: channelStates.InitializingChannelState = {
  asAddress: defaultInitializedChannelStatus,
};

const defaultChannelOpen: sharedStates.ChannelOpen = {
  ...defaultParams,
  address: bsAddress,
  privateKey: bsPrivateKey,
  channelId,
  libraryAddress,
  ourIndex: 0,
  participants,
  channelNonce: 0,
  turnNum: 0,
  funded: false,
};

const defaultChannelStatus: channelStates.ChannelStatus = fundingStates.waitForFundingAndPostFundSetup(
  {
    ...defaultChannelOpen,
  },
);

const defaultInitializedChannelState: channelStates.InitializedChannelState = {
  channelId: defaultChannelStatus,
  anotherId: defaultChannelStatus,
};

const defaultChannelState: channelStates.ChannelState = {
  initializingChannels: defaultInitializingChannelState,
  initializedChannels: defaultInitializedChannelState,
  // activeAppChannelId: '',
};

const defaultInitialized: walletStates.Initialized = walletStates.initialized({
  ...defaultParams,
  commitment: {},
  funded: false,
  userAddress: bsAddress,
  channelState: defaultChannelState,
  outboxState: EMPTY_OUTBOX_STATE,
  consensusLibrary: '',
  directFundingStore: {},
});

////////////////////////////////////////////////
// WALLET STATES FOR INDIRECT FUNDING PROCESS //
////////////////////////////////////////////////

// WALLET INITIALIZED
export const dummyWaitForApproval: walletStates.Initialized = {
  ...defaultInitialized,
  indirectFunding: waitForApproval({
    ...defaultInitialized,
    ...defaultParams,
  }),
};

export const dummyWaitForPreFundSetup0: walletStates.WalletState = {
  ...dummyWaitForApproval,
  indirectFunding: waitForPreFundSetup0({
    ...defaultInitialized,
    ...defaultParams,
    ledgerId: '0xLedger',
  }),
};

export const dummyWaitForPostFundSetup0: walletStates.WalletState = {
  ...dummyWaitForPreFundSetup0,
  indirectFunding: waitForPostFundSetup0({
    ...defaultInitialized,
    ...defaultParams,
    ledgerId: '0xLedger',
  }),
};

export const dummyWaitForLedgerUpdate0: walletStates.WalletState = {
  ...dummyWaitForPreFundSetup0,
  indirectFunding: waitForLedgerUpdate0({
    ...defaultInitialized,
    ...defaultParams,
    ledgerId: '0xLedger',
  }),
};
