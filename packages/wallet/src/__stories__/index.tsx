
import React from 'react';
import { storiesOf } from '@storybook/react';
import WalletContainer from '../containers/wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/state';
import {
  dummyWaitForApprovalA,
  dummyWaitForLogin,
 } from './a-dummy-wallet-states';
import '../index.scss';
import NetworkStatus from '../components/network-status';


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
// function walletStateFromChannelState<T extends channelStates.OpenedState>(
//   channelState: T,
//   networkId?: number,
// ): walletStates.WalletState {
//   return {
//     ...initializedWalletState,
//     channelState: {
//       initializedChannels: { [channelState.channelId]: channelState },
//       initializingChannels: {},
//     },
//     networkId: networkId || 3,
//   };
// }

const walletStateRender = state => () => {
  // const fullState = { ...initializedWalletState, networkId: 3, ...state };
  return (
    <Provider store={fakeStore(state)}>
      <WalletContainer position="center"/>
    </Provider>
  );
};

const twinWalletStateRender = (aState: walletStates.Initialized ,bState: walletStates.Initialized) => () => {
  // const aFullState = { ...initializedWalletState, networkId: 3, ...aState };
  // const bFullState = { ...initializedWalletState, networkId: 3, ...bState };
  return (
    <div>
    <Provider store={fakeStore(aState)}>
        <WalletContainer position="left"/>
      </Provider>
    <Provider store={fakeStore(bState)}>
        <WalletContainer position="right"/>
      </Provider>
      </div>
  );
};

// const channelStateRender = channelState => () => {
//   const walletState = walletStateFromChannelState(channelState);
//   return (
//     <Provider store={fakeStore(walletState)}>
//       <WalletContainer />
//     </Provider>
//   );
// };

storiesOf('Network Status', module)
  .add('Mainnet', () => (
    <Provider store={fakeStore({ networkId: 1 })}>
      <NetworkStatus />
    </Provider>
  ))
  .add('Kovan', () => (
    <Provider store={fakeStore({ networkId: 42 })}>
      <NetworkStatus />
    </Provider>
  ))
  .add('Ropsten', () => (
    <Provider store={fakeStore({ networkId: 3 })}>
      <NetworkStatus />
    </Provider>
  ))
  .add('Rinkeby', () => (
    <Provider store={fakeStore({ networkId: 4 })}>
      <NetworkStatus />
    </Provider>
  ))
  .add('Ganache', () => (
    <Provider store={fakeStore({ networkId: 5777 })}>
      <NetworkStatus />
    </Provider>
  ));

function addTwinStoriesFromCollection(collection, chapter, renderer = twinWalletStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(storyName, renderer(collection[storyName].a,collection[storyName].b));
  });
}

// function addStoriesFromCollection(collection, chapter, renderer = channelStateRender) {
//   Object.keys(collection).map(storyName => {
//     storiesOf(chapter, module).add(storyName, renderer(collection[storyName]));
//   });
// }



const TwinWalletScreensIndirectFunding = [
  {a: dummyWaitForApprovalA, b: dummyWaitForApprovalA},
  // WaitForPreFundSetup1: {
  //   channelState: channelStates.waitForFundingAndPostFundSetup(playerADefaults),
  //   fundingState: fundingStates.depositing.waitForTransactionSent(defaultFundingState),
  // },
  // WaitForDepositApproval: {
  //   channelState: channelStates.waitForFundingAndPostFundSetup({
  //     ...playerADefaults,
  //   }),
  //   fundingState: fundingStates.depositing.waitForDepositApproval(defaultFundingState),
  // },
  // WaitForDepositConfirmation: {
  //   channelState: channelStates.waitForFundingAndPostFundSetup({
  //     ...playerADefaults,
  //   }),
  //   fundingState: fundingStates.depositing.waitForDepositConfirmation(fundingStateWithTX),
  // },
  // WaitForFundingConfirmed: {
  //   channelState: channelStates.waitForFundingAndPostFundSetup({
  //     ...playerADefaults,
  //   }),
  //   fundingState: fundingStates.waitForFundingConfirmed(defaultFundingState),
  // },
  // WaitForPostFundSetup: { channelState: channelStates.aWaitForPostFundSetup(playerADefaults) },
];
addTwinStoriesFromCollection(
  TwinWalletScreensIndirectFunding,
  'Wallet Screens / Indirect Funding / Player A x Player B',
  twinWalletStateRender,
);

// const WalletScreensFundingPlayerB = {
//   NotSafeToDeposit: {
//     channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
//     fundingState: fundingStates.notSafeToDeposit(defaultFundingState),
//   },
//   WaitForTransactionSent: {
//     channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
//     fundingState: fundingStates.depositing.waitForTransactionSent(defaultFundingState),
//   },
//   WaitForDepositApproval: {
//     channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
//     fundingState: fundingStates.depositing.waitForDepositApproval(defaultFundingState),
//   },
//   WaitForDepositConfirmation: {
//     channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
//     fundingState: fundingStates.depositing.waitForDepositConfirmation(fundingStateWithTX),
//   },
//   WaitForFundingConfirmed: {
//     channelState: channelStates.waitForFundingAndPostFundSetup(playerBDefaults),
//     fundingState: fundingStates.waitForFundingConfirmed(defaultFundingState),
//   },
//   WaitForPostFundSetup: { channelState: channelStates.aWaitForPostFundSetup(playerBDefaults) },
// };
// addStoriesFromCollection(
//   WalletScreensFundingPlayerB,
//   'Wallet Screens / Indirect Funding / Player B',
//   walletStateRender,
// );

// // Against bot, who sends funding too early:
// const WalletScreensIndirectFundingPlayerAPart2 = {
//   WaitForTransactionSent: {
//     channelState: channelStates.waitForFundingConfirmation(playerADefaults),
//     fundingState: fundingStates.depositing.waitForTransactionSent(defaultFundingState),
//   },
//   WaitForDepositApproval: {
//     channelState: channelStates.waitForFundingConfirmation({
//       ...playerADefaults,
//     }),
//     fundingState: fundingStates.depositing.waitForDepositApproval(defaultFundingState),
//   },
//   WaitForDepositConfirmation: {
//     channelState: channelStates.waitForFundingConfirmation({
//       ...playerADefaults,
//     }),
//     fundingState: fundingStates.depositing.waitForDepositConfirmation(fundingStateWithTX),
//   },
//   WaitForFundingConfirmed: {
//     channelState: channelStates.waitForFundingConfirmation({
//       ...playerADefaults,
//     }),
//     fundingState: fundingStates.waitForFundingConfirmed(defaultFundingState),
//   },
// };
// addStoriesFromCollection(
//   WalletScreensIndirectFundingPlayerAPart2,
//   'Wallet Screens / Indirect Funding / Player A -- already have PostFundSetup',
//   walletStateRender,
// );

// const WalletScreendsWithdrawing = {
//   ApproveWithdrawal: channelStates.approveWithdrawal(playerADefaults),
//   WaitForWithdrawalInitiation: channelStates.waitForWithdrawalInitiation(playerADefaults),
//   WaitForWithdrawalConfirmation: channelStates.waitForWithdrawalConfirmation(playerADefaults),
//   AcknowledgeWithdrawalSuccess: channelStates.acknowledgeWithdrawalSuccess(playerADefaults),
// };
// addStoriesFromCollection(WalletScreendsWithdrawing, 'Wallet Screens / Withdrawing');

// const WalletScreensChallenging = {
//   ApproveChallenge: channelStates.approveChallenge(playerADefaults),
//   WaitForChallengeInitiation: channelStates.waitForChallengeInitiation(playerADefaults),
//   WaitForChallengeSubmission: channelStates.waitForChallengeSubmission(playerADefaults),
//   WaitForChallengeConfirmation: channelStates.waitForChallengeConfirmation(playerADefaults),
//   WaitForResponseOrTimeout: channelStates.waitForResponseOrTimeout(playerADefaults),
//   AcknowledgeChallengeResponse: channelStates.acknowledgeChallengeResponse(playerADefaults),
//   AcknowledgeChallengeTimeout: channelStates.acknowledgeChallengeTimeout(playerADefaults),
// };
// addStoriesFromCollection(WalletScreensChallenging, 'Wallet Screens / Challenging');

// const WalletScreendsResponding = {
//   ChooseResponse: channelStates.chooseResponse(playerADefaults),
//   AcknowledgeChallengeTimeout: channelStates.challengeeAcknowledgeChallengeTimeOut(playerADefaults),
//   TakeMoveInApp: channelStates.takeMoveInApp(playerADefaults),
//   InitiateResponse: channelStates.initiateResponse(playerADefaults),
//   WaitForResponseSubmission: channelStates.waitForResponseSubmission(playerADefaults),
//   WaitForResponseConfirmation: channelStates.waitForResponseConfirmation(playerADefaults),
//   AcknowledgeChallengeComplete: channelStates.acknowledgeChallengeComplete(playerADefaults),
// };
// addStoriesFromCollection(WalletScreendsResponding, 'Wallet Screens / Responding');

// const WalletScreendsClosing = {
//   ApproveConclude: channelStates.approveConclude(playerADefaults),
//   WaitForOpponentConclude: channelStates.waitForOpponentConclude(playerADefaults),
//   AcknowledgeConcludeSuccess: channelStates.approveCloseOnChain(playerADefaults),
// };
// addStoriesFromCollection(WalletScreendsClosing, 'Wallet Screens / Closing');

storiesOf('Wallet Landing Page', module).add(
  'Landing Page',
  walletStateRender(dummyWaitForLogin),
);
