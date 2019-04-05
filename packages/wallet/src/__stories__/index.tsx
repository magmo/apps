
import React from 'react';
import { storiesOf } from '@storybook/react';
import WalletContainer from '../containers/wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/state';
import * as channelStates from '../redux/channel-state/state';

 import {
  dummyWaitForLogin,
  dummyWaitForAdjudicator,
  dummyWaitForMetaMask,
 } from './dummy-wallet-states';
 import {
  playerADefaults,
  dummyWaitForApproval,
  dummyWaitForPreFundSetup1,
  dummyWaitForPostFundSetup1,
  dummyWaitForLedgerUpdate1,
  dummyWaitForDirectFunding,
 } from './a-dummy-wallet-states';
 import {
  playerBDefaults,
  dummyWaitForPreFundSetup0,
  dummyWaitForPostFundSetup0,
  dummyWaitForLedgerUpdate0,
 } from './b-dummy-wallet-states';

 import '../index.scss';


const fakeStore = state => ({
  dispatch: action => {
    alert(`Action ${action.type} triggered`);
    return action;
  },
  getState: () => state,
  subscribe: () => () => {
    /* empty */
  },
  replaceReducer: () => {
    /* empty */
  },
});


// Want to return top level wallet state, not the channel state
function walletStateFromChannelState(
  channelState: channelStates.OpenedState,
  networkId?: number,
): walletStates.WalletState {
  return {
    ...dummyWaitForApproval,
    type: walletStates.WALLET_INITIALIZED,
    channelState: {
      initializedChannels: { 'RPS': channelState }, // This is crucial for getting routed to the appropriate view
      initializingChannels: {},
      activeAppChannelId: 'RPS', // So is this
    },
    networkId: networkId || 3,
  };
}

const walletStateRender = state => () => {
  return (
    <Provider store={fakeStore(state)}>
      <WalletContainer position="center"/>
    </Provider>
  );
};

const twinWalletStateRender = (aState: walletStates.Initialized ,bState: walletStates.Initialized) => () => {
  return (
    <div>
      Player A x Player B
    <Provider store={fakeStore(aState)}>
        <WalletContainer position="left"/>
      </Provider>
    <Provider store={fakeStore(bState)}>
        <WalletContainer position="right"/>
      </Provider>
      </div>
  );
};

const channelStateRender = channelState => () => {
  const walletState = walletStateFromChannelState(channelState);
  return (
    <Provider store={fakeStore(walletState)}>
      <WalletContainer />
    </Provider>
  );
};



function addTwinStoriesFromCollection(collection, chapter, renderer = twinWalletStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(storyName, renderer(collection[storyName].a,collection[storyName].b));
  });
}

function addStoriesFromCollection(collection, chapter, renderer = walletStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(storyName, renderer(collection[storyName]));
  });
}

const WalletScreensNotInitialized = {
  "WaitForLogIn": dummyWaitForLogin,
  "WaitForAdjudicator": dummyWaitForAdjudicator,
  "WaitForMetaMask": dummyWaitForMetaMask,
}

addStoriesFromCollection(
  WalletScreensNotInitialized,
  'Not Initialized '
);

const NetworkStatuses = {
  "Mainnet": { ...dummyWaitForLogin, networkId: 1 },
  "Kovan": { ...dummyWaitForLogin, networkId: 42 },
  "Ropsten": { ...dummyWaitForLogin, networkId: 3 },
  "Rinkeby": { ...dummyWaitForLogin, networkId: 4 },
  "Ganache": { ...dummyWaitForLogin, networkId: 5777 },
}

addStoriesFromCollection(
  NetworkStatuses,
  'Network Statuses'
);

const TwinWalletScreensIndirectFunding = {
  "Both in WaitForApproval": {a: dummyWaitForApproval, b: dummyWaitForApproval},
  "Both in WaitForPreFundSetup": {a:  dummyWaitForPreFundSetup1, b: dummyWaitForPreFundSetup0},
  "Both in WaitForDirectFunding": {a:  dummyWaitForDirectFunding, b: dummyWaitForDirectFunding},
  "Both in WaitForPostFundSetup": {a:  dummyWaitForPostFundSetup1, b: dummyWaitForPostFundSetup0},
  "Both in WaitForLedgerUpdate": {a:  dummyWaitForLedgerUpdate1, b: dummyWaitForLedgerUpdate0},  
};

addTwinStoriesFromCollection(
  TwinWalletScreensIndirectFunding,
  'Multi-Channel Processes / Indirect Funding Process',
  twinWalletStateRender,
);

const WalletScreensFundingPlayerA = {
  WaitForTransactionSent: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerADefaults),
  },
  WaitForDepositApproval: {
    channelState: channelStates.waitForFundingAndPostFundSetup({
      ...playerADefaults,
    }),
  },
  WaitForDepositConfirmation: {
    channelState: channelStates.waitForFundingAndPostFundSetup({
      ...playerADefaults,
    }),
  },
  WaitForFundingConfirmed: {
    channelState: channelStates.waitForFundingAndPostFundSetup({
      ...playerADefaults,
    }),
  },
  WaitForPostFundSetup: { channelState: channelStates.aWaitForPostFundSetup(playerADefaults) },
};
addStoriesFromCollection(
  WalletScreensFundingPlayerA,
  'Single Channel Processes / Funding / Player A',
  channelStateRender,
);

const WalletScreensFundingPlayerB = {
  NotSafeToDeposit: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
  },
  WaitForTransactionSent: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
  },
  WaitForDepositApproval: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
  },
  WaitForDepositConfirmation: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
  },
  WaitForFundingConfirmed: {
    channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
  },
  WaitForPostFundSetup: { channelState: channelStates.aWaitForPostFundSetup(playerBDefaults) },
};
addStoriesFromCollection(
  WalletScreensFundingPlayerB,
  'Single Channel Processes / Funding / Player B',
  channelStateRender,
);

// Against bot, who sends funding too early:
const WalletScreensFundingPlayerAPart2 = {
  WaitForTransactionSent: {
    channelState: channelStates.waitForFundingConfirmation(playerADefaults),
  },
  WaitForDepositApproval: {
    channelState: channelStates.waitForFundingConfirmation({
      ...playerADefaults,
    }),
  },
  WaitForDepositConfirmation: {
    channelState: channelStates.waitForFundingConfirmation({
      ...playerADefaults,
    }),
  },
  WaitForFundingConfirmed: {
    channelState: channelStates.waitForFundingConfirmation({
      ...playerADefaults,
    }),
  },
};
addStoriesFromCollection(
  WalletScreensFundingPlayerAPart2,
  'Single Channel Processes / Funding / Player A -- already have PostFundSetup',
  channelStateRender,
);

const WalletScreendsWithdrawing = {
  ApproveWithdrawal: channelStates.approveWithdrawal(playerADefaults),
  WaitForWithdrawalInitiation: channelStates.waitForWithdrawalInitiation(playerADefaults),
  WaitForWithdrawalConfirmation: channelStates.waitForWithdrawalConfirmation(playerADefaults),
  AcknowledgeWithdrawalSuccess: channelStates.acknowledgeWithdrawalSuccess(playerADefaults),
};
addStoriesFromCollection(WalletScreendsWithdrawing, 'Single Channel Processes / Withdrawing',
channelStateRender);

const WalletScreensChallenging = {
  ApproveChallenge: channelStates.approveChallenge(playerADefaults),
  WaitForChallengeInitiation: channelStates.waitForChallengeInitiation(playerADefaults),
  WaitForChallengeSubmission: channelStates.waitForChallengeSubmission(playerADefaults),
  WaitForChallengeConfirmation: channelStates.waitForChallengeConfirmation(playerADefaults),
  WaitForResponseOrTimeout: channelStates.waitForResponseOrTimeout(playerADefaults),
  AcknowledgeChallengeResponse: channelStates.acknowledgeChallengeResponse(playerADefaults),
  AcknowledgeChallengeTimeout: channelStates.acknowledgeChallengeTimeout(playerADefaults),
};
addStoriesFromCollection(WalletScreensChallenging, 'Single Channel Processes / Challenging',
channelStateRender);

const WalletScreendsResponding = {
  ChooseResponse: channelStates.chooseResponse(playerADefaults),
  AcknowledgeChallengeTimeout: channelStates.challengeeAcknowledgeChallengeTimeOut(playerADefaults),
  TakeMoveInApp: channelStates.takeMoveInApp(playerADefaults),
  InitiateResponse: channelStates.initiateResponse(playerADefaults),
  WaitForResponseSubmission: channelStates.waitForResponseSubmission(playerADefaults),
  WaitForResponseConfirmation: channelStates.waitForResponseConfirmation(playerADefaults),
  AcknowledgeChallengeComplete: channelStates.acknowledgeChallengeComplete(playerADefaults),
};
addStoriesFromCollection(WalletScreendsResponding, 'Single Channel Processes / Responding',
channelStateRender);

const WalletScreendsClosing = {
  ApproveConclude: channelStates.approveConclude(playerADefaults),
  WaitForOpponentConclude: channelStates.waitForOpponentConclude(playerADefaults),
  AcknowledgeConcludeSuccess: channelStates.approveCloseOnChain(playerADefaults),
};
addStoriesFromCollection(WalletScreendsClosing, 'Single Channel Processes / Closing',
channelStateRender);
storiesOf('Landing Page', module).add(
  'Landing Page',
  walletStateRender({}),
);
