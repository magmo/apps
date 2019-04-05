import React from 'react';
import { storiesOf } from '@storybook/react';
import WalletContainer from '../containers/wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/state';
import * as channelStates from '../redux/channel-state/state';
import '../index.scss';
import * as scenarios from '../redux/__tests__/test-scenarios';
import NetworkStatus from '../components/network-status';
import { channelFunded } from '../redux/funding-state/state';
import { EMPTY_OUTBOX_STATE } from '../redux/outbox/state';
import { WaitForFundingAndPostFundSetup } from '../redux/channel-state/state';

const {
  asAddress,
  asPrivateKey,
  bsAddress,
  // bsPrivateKey,
  channelId,
  channelNonce,
  libraryAddress,
  participants,
  preFundCommitment1,
  preFundCommitment2,
} = scenarios;

const YOUR_CONTRIBUTION = bigNumberify(500000000000000).toHexString();
const TOTAL_CONTRIBUTION = bigNumberify(YOUR_CONTRIBUTION)
  .mul(2)
  .toHexString();

const defaultFundingState: fundingStates.DirectFundingStatus = {
  fundingType: fundingStates.DIRECT_FUNDING,
  requestedTotalFunds: TOTAL_CONTRIBUTION,
  requestedYourContribution: YOUR_CONTRIBUTION,
  channelId: 'channel id',
  ourIndex: 0,
  safeToDepositLevel: YOUR_CONTRIBUTION,
  depositStatus: fundingStates.depositing.WAIT_FOR_TRANSACTION_SENT,
  channelFundingStatus: fundingStates.NOT_SAFE_TO_DEPOSIT,
};

// const fundingStateWithTX = { ...defaultFundingState, transactionHash: 'TX_HASH' };

const defaults = {
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
const playerADefaults = {
  ...defaults,
  ourIndex: 0,
  fundingState: channelFunded(defaultFundingState),
  address: asAddress,
};
// const playerBDefaults = {
//   ...defaults,
//   ourIndex: 1,
//   fundingState: channelFunded(defaultFundingState),
//   address: bsAddress,
// };

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

const initializedWalletState = walletStates.initialized({
  ...walletStates.waitForLogin(),
  unhandledAction: undefined,
  ...walletStates.emptyState,
  channelState: {
    initializedChannels: {
      [channelId]: channelStates.waitForFundingAndPostFundSetup({ ...playerADefaults }),
    },
    initializingChannels: {},
  },
  networkId: 4,
  adjudicator: '',
  uid: '',
  consensusLibrary: '0x0',
});

// Want to return top level wallet state, not the channel state
function walletStateFromChannelState<T extends channelStates.OpenedState>(
  channelState: T,
  networkId?: number,
): walletStates.WalletState {
  return {
    ...initializedWalletState,
    channelState: {
      initializedChannels: { [channelState.channelId]: channelState },
      initializingChannels: {},
    },
    networkId: networkId || 3,
  };
}

const walletStateRender = state => () => {
  const fullState = { ...initializedWalletState, networkId: 3, ...state };
  return (
    <Provider store={fakeStore(fullState)}>
      <WalletContainer />
    </Provider>
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

function addStoriesFromCollection(collection, chapter, renderer = channelStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(storyName, renderer(collection[storyName]));
  });
}

const WaitForApproval: walletStates.Initialized = {
  type: 'WALLET.INITIALIZED',
  channelState: {
    initializingChannels:
      {},
    initializedChannels:
      {'RPS': {
        address: asAddress,
        privateKey: asPrivateKey,
        channelId: 'RPS',
        libraryAddress: '',
        ourIndex: 0,
        participants: [asAddress, bsAddress],
        channelNonce: 0,
        turnNum: 2,
        lastCommitment: {
          commitment: {
            commitmentType: 0, // prefundsetup
            appAttributes: '',
          },
          signature: '',
          },
        funded: false,
        penultimateCommitment: {
          commitment: {
            channel: {
              channelType: '0',
              nonce: 0,
              participants: [asAddress,bsAddress],
            },
            turnNum: 1,
            allocation: ['5','5'],
            destination: [asAddress,bsAddress],
            commitmentCount: 1,
            commitmentType: 0, // prefundsetup
            appAttributes: '',
          },
          signature: '',
        },
        type: 'WAIT_FOR_FUNDING_AND_POST_FUND_SETUP',
        stage: 'FUNDING',
      }  as WaitForFundingAndPostFundSetup } ,
  },
  fundingState: {
    directFunding: 
      {channelId: {
        requestedTotalFunds: '10',
        requestedYourContribution: '5',
        channelId,
        ourIndex: 0,
        fundingType: 'FUNDING_TYPE.DIRECT',
        safeToDepositLevel: '1',
        channelFundingStatus: 'NOT_SAFE_TO_DEPOSIT',
      }},
    indirectFunding:
      {channelId: {
        placeholder: 'placeholder',
      }},
    },
  outboxState: {
    displayOutbox: [],
    messageOutbox: [],
    transactionOutbox: [],
  },
  uid: '9',
  networkId: 1,
  adjudicator: 'somewhere',
}

const WalletScreensIndirectFundingPlayerA = {
  WaitForApproval,
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
};
addStoriesFromCollection(
  WalletScreensIndirectFundingPlayerA,
  'Wallet Screens / Indirect Funding / Player A',
  walletStateRender,
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

// storiesOf('Wallet Landing Page', module).add(
//   'Landing Page',
//   channelStateRender(walletStates.waitForLogin()),
// );
