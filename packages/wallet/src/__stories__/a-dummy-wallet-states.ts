import * as walletStates from '../redux/state';
import * as channelStates from '../redux/channel-state/state';
import * as fundingStates from '../redux/channel-state/funding/state';
import * as sharedStates from '../redux/channel-state/shared/state';

import * as scenarios from '../redux/__tests__/test-scenarios';

import { EMPTY_OUTBOX_STATE } from '../redux/outbox/state';

import { waitForApproval } from '../redux/indirect-funding/player-a/state';

/////////////////////
// DEFAULT OBJECTS //
/////////////////////

const {
    asAddress,
    asPrivateKey,
    // bsAddress,
    // bsPrivateKey,
    channelId,
    channelNonce,
    libraryAddress,
    participants,
    preFundCommitment1,
    preFundCommitment2,
  } = scenarios;


const defaultParams = {
    adjudicator: 'adj-address',
    channelId,
    channelNonce,
    libraryAddress,
    participants,
    privateKey: asPrivateKey,
    uid: 'uid',
    lastCommitment: { commitment: preFundCommitment2, signature: 'fake-sig' },
    penultimateCommitment: { commitment: preFundCommitment1, signature: 'fake-sig' },
    turnNum: preFundCommitment2.turnNum,
    networkId: 3,
    challengeExpiry: 0,
    transactionHash: '0x0',
    userAddress: '0x0',
    funded: false,
  };



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

const defaultInitializingChannelState: channelStates.InitializingChannelState  = {
    asAddress: defaultInitializedChannelStatus,
};
  
const defaultChannelOpen: sharedStates.ChannelOpen = {
    ...defaultParams,
    address: asAddress,
    privateKey: asPrivateKey,
    channelId,
    libraryAddress,
    ourIndex: 0,
    participants,
    channelNonce: 0,
    turnNum: 0,
    funded: false,
}

const defaultChannelStatus: channelStates.ChannelStatus = fundingStates.waitForFundingAndPostFundSetup(
{
    ...defaultChannelOpen,
}
);

const defaultInitializedChannelState: channelStates.InitializedChannelState  = {
channelId: defaultChannelStatus,
};

const defaultChannelState: channelStates.ChannelState = {
initializingChannels: defaultInitializingChannelState,
initializedChannels: defaultInitializedChannelState,
// activeAppChannelId: '',
}


const defaultInitialized: walletStates.Initialized = walletStates.initialized(
{
    ...defaultParams,
    commitment: {},
    funded: false,
    userAddress: asAddress,
    channelState: defaultChannelState,
    outboxState: EMPTY_OUTBOX_STATE,
    consensusLibrary: '',
    directFundingStore: {},
}
);


export const dummyWaitForApprovalA: walletStates.WalletState = {
    ...defaultInitialized,
    indirectFunding: waitForApproval({
        ...defaultInitialized,
        ...defaultParams,
    }),
};


// player agnostic (should go in separate file)
export const dummyWaitForLogin: walletStates.WalletState = walletStates.waitForLogin();
