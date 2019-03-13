import React from 'react';
import { storiesOf } from '@storybook/react';
import Wallet from '../containers/Wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/states';
import * as channelStates from '../redux/states/channels';
import * as fundingStates from '../redux/states/channels/funding/index';
import '../index.scss';
import * as scenarios from '../redux/reducers/__tests__/test-scenarios';
import { bigNumberify } from 'ethers/utils';

const {
  asAddress,
  channelId,
  asPrivateKey,
  channelNonce,
  libraryAddress,
  participants,
  preFundCommitment1,
  preFundCommitment2,
} = scenarios;

const defaultFundingState = fundingStates.fundingConfirmed({
  fundingType: fundingStates.DIRECT_FUNDING,
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
  requestedYourContribution: bigNumberify(500000000000000).toHexString(),
});

const defaultFundingStateWithTx = { ...defaultFundingState, transactionHash: 'tx_hash' };

const defaults = {
  address: asAddress,
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
  fundingState: defaultFundingState,
  funded: false,
};
const playerADefaults = {
  ...defaults,
  ourIndex: 0,
};
const playerBDefaults = {
  ...defaults,
  ourIndex: 1,
};

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

const testState = state => () => (
  <Provider store={fakeStore({ state })}>
    <Wallet />
  </Provider>
);

const testStateFromChannelState = channelState => () => (
  <Provider store={fakeStore({ channelState })}>
    <Wallet />
  </Provider>
);

const testStateFromFundingState = fundingState => () => (
  <Provider store={fakeStore({ channelState: { fundingState } })}>
    <Wallet />
  </Provider>
);

storiesOf('Network Status', module)
  .add('Mainnet', testStateFromChannelState(channelStates.approveFunding({ ...playerADefaults })))
  .add('Kovan', testStateFromChannelState(channelStates.approveFunding({ ...playerADefaults })))
  .add('Ropsten', testStateFromChannelState(channelStates.approveFunding({ ...playerADefaults })))
  .add('Rinkeby', testStateFromChannelState(channelStates.approveFunding({ ...playerADefaults })))
  .add('Ganache', testStateFromChannelState(channelStates.approveFunding({ ...playerADefaults })));
storiesOf('Wallet Screens / Funding / Player A', module)
  .add('ApproveFunding', testStateFromChannelState(channelStates.approveFunding(playerADefaults)))
  .add(
    'AWaitForDepositToBeSentToMetaMask',
    testStateFromFundingState(fundingStates.aWaitForDepositToBeSentToMetaMask(defaultFundingState)),
  )
  .add(
    'ASubmitDepositInMetaMask',
    testStateFromFundingState(fundingStates.aSubmitDepositInMetaMask(defaultFundingState)),
  )
  .add(
    'AWaitForDepositConfirmation',
    testStateFromFundingState(fundingStates.aWaitForDepositConfirmation(defaultFundingStateWithTx)),
  )
  .add(
    'AWaitForOpponentDeposit',
    testStateFromFundingState(fundingStates.aWaitForOpponentDeposit(defaultFundingState)),
  )
  .add(
    'AWaitForPostFundSetup',
    testStateFromChannelState(channelStates.aWaitForPostFundSetup(playerADefaults)),
  )
  .add(
    'AcknowledgeFundingSuccess',
    testStateFromChannelState(channelStates.acknowledgeFundingSuccess(playerADefaults)),
  );

storiesOf('Wallet Screens / Funding / Player B', module)
  .add('ApproveFunding', testStateFromChannelState(channelStates.approveFunding(playerBDefaults)))
  .add(
    'BWaitForOpponentDeposit',
    testStateFromChannelState(channelStates.waitForFundingConfirmation(playerBDefaults)),
  )
  .add(
    'BWaitForDepositToBeSentToMetaMask',
    testStateFromFundingState(fundingStates.bWaitForDepositToBeSentToMetaMask(defaultFundingState)),
  )
  .add(
    'BSubmitDepositInMetaMask',
    testStateFromFundingState(fundingStates.bSubmitDepositInMetaMask(defaultFundingState)),
  )
  .add(
    'BWaitForDepositConfirmation',
    testStateFromFundingState(fundingStates.bWaitForDepositConfirmation(defaultFundingStateWithTx)),
  )
  .add(
    'BWaitForPostFundSetup',
    testStateFromChannelState(channelStates.bWaitForPostFundSetup(playerBDefaults)),
  )
  .add(
    'AcknowledgeFundingSuccess',
    testStateFromChannelState(channelStates.acknowledgeFundingSuccess(playerBDefaults)),
  );

storiesOf('Wallet Screens / Withdrawing', module)
  .add(
    'ApproveWithdrawal',
    testStateFromChannelState(channelStates.approveWithdrawal(playerADefaults)),
  )
  .add(
    'WaitForWithdrawalInitiation',
    testStateFromChannelState(channelStates.waitForWithdrawalInitiation(playerADefaults)),
  )
  .add(
    'WaitForWithdrawalConfirmation',
    testStateFromChannelState(channelStates.waitForWithdrawalConfirmation(playerADefaults)),
  )
  .add(
    'AcknowledgeWithdrawalSuccess',
    testStateFromChannelState(channelStates.acknowledgeWithdrawalSuccess(playerADefaults)),
  );

storiesOf('Wallet Screens / Challenging', module)
  .add(
    'ApproveChallenge',
    testStateFromChannelState(channelStates.approveChallenge(playerADefaults)),
  )
  .add(
    'WaitForChallengeInitiation',
    testStateFromChannelState(channelStates.waitForChallengeInitiation(playerADefaults)),
  )
  .add(
    'WaitForChallengeSubmission',
    testStateFromChannelState(channelStates.waitForChallengeSubmission(playerADefaults)),
  )
  .add(
    'WaitForChallengeConfirmation',
    testStateFromChannelState(channelStates.waitForChallengeConfirmation(playerADefaults)),
  )
  .add(
    'WaitForResponseOrTimeout',
    testStateFromChannelState(channelStates.waitForResponseOrTimeout(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeResponse',
    testStateFromChannelState(channelStates.acknowledgeChallengeResponse(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeTimeout',
    testStateFromChannelState(channelStates.acknowledgeChallengeTimeout(playerADefaults)),
  );

storiesOf('Wallet Screens / Responding', module)
  .add('ChooseResponse', testStateFromChannelState(channelStates.chooseResponse(playerADefaults)))
  .add(
    'AcknowledgeChallengeTimeout',
    testStateFromChannelState(channelStates.challengeeAcknowledgeChallengeTimeOut(playerADefaults)),
  )
  .add('TakeMoveInApp', testStateFromChannelState(channelStates.takeMoveInApp(playerADefaults)))
  .add(
    'InitiateResponse',
    testStateFromChannelState(channelStates.initiateResponse(playerADefaults)),
  )
  .add(
    'WaitForResponseSubmission',
    testStateFromChannelState(channelStates.waitForResponseSubmission(playerADefaults)),
  )
  .add(
    'WaitForResponseConfirmation',
    testStateFromChannelState(channelStates.waitForResponseConfirmation(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeComplete',
    testStateFromChannelState(channelStates.acknowledgeChallengeComplete(playerADefaults)),
  );

storiesOf('Wallet Screens / Closing', module)
  .add('ApproveConclude', testStateFromChannelState(channelStates.approveConclude(playerADefaults)))
  .add(
    'WaitForOpponentConclude',
    testStateFromChannelState(channelStates.waitForOpponentConclude(playerADefaults)),
  )
  .add(
    'AcknowledgeConcludeSuccess',
    testStateFromChannelState(channelStates.approveCloseOnChain(playerADefaults)),
  );

storiesOf('Wallet Landing Page', module).add(
  'Landing Page',
  testState(walletStates.waitForLogin({ outboxState: {} })),
);
