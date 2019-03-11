import React from 'react';
import { storiesOf } from '@storybook/react';
import Wallet from '../containers/Wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/states';
import * as channelStates from '../redux/states/channels';
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
  fundingState: {
    requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
    requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
  },
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
  <Provider store={fakeStore(state)}>
    <Wallet />
  </Provider>
);

storiesOf('Network Status', module)
  .add('Mainnet', testState(channelStates.approveFunding({ ...playerADefaults, networkId: 1 })))
  .add('Kovan', testState(channelStates.approveFunding({ ...playerADefaults, networkId: 4 })))
  .add('Ropsten', testState(channelStates.approveFunding({ ...playerADefaults, networkId: 3 })))
  .add('Rinkeby', testState(channelStates.approveFunding({ ...playerADefaults, networkId: 42 })))
  .add('Ganache', testState(channelStates.approveFunding({ ...playerADefaults, networkId: 5777 })));
storiesOf('Wallet Screens / Funding / Player A', module)
  .add('ApproveFunding', testState(channelStates.approveFunding(playerADefaults)))
  .add(
    'AWaitForDepositToBeSentToMetaMask',
    testState(channelStates.aWaitForDepositToBeSentToMetaMask(playerADefaults)),
  )
  .add(
    'ASubmitDepositInMetaMask',
    testState(channelStates.aSubmitDepositInMetaMask(playerADefaults)),
  )
  .add(
    'AWaitForDepositConfirmation',
    testState(channelStates.aWaitForDepositConfirmation(playerADefaults)),
  )
  .add('AWaitForOpponentDeposit', testState(channelStates.aWaitForOpponentDeposit(playerADefaults)))
  .add('AWaitForPostFundSetup', testState(channelStates.aWaitForPostFundSetup(playerADefaults)))
  .add(
    'AcknowledgeFundingSuccess',
    testState(channelStates.acknowledgeFundingSuccess(playerADefaults)),
  );

storiesOf('Wallet Screens / Funding / Player B', module)
  .add('ApproveFunding', testState(channelStates.approveFunding(playerBDefaults)))
  .add(
    'BWaitForOpponentDeposit',
    testState(channelStates.waitForFundingConfirmation(playerBDefaults)),
  )
  .add(
    'BWaitForDepositToBeSentToMetaMask',
    testState(channelStates.bWaitForDepositToBeSentToMetaMask(playerBDefaults)),
  )
  .add(
    'BSubmitDepositInMetaMask',
    testState(channelStates.bSubmitDepositInMetaMask(playerBDefaults)),
  )
  .add(
    'BWaitForDepositConfirmation',
    testState(channelStates.bWaitForDepositConfirmation(playerBDefaults)),
  )
  .add('BWaitForPostFundSetup', testState(channelStates.bWaitForPostFundSetup(playerBDefaults)))
  .add(
    'AcknowledgeFundingSuccess',
    testState(channelStates.acknowledgeFundingSuccess(playerBDefaults)),
  );

storiesOf('Wallet Screens / Withdrawing', module)
  .add('ApproveWithdrawal', testState(channelStates.approveWithdrawal(playerADefaults)))
  .add(
    'WaitForWithdrawalInitiation',
    testState(channelStates.waitForWithdrawalInitiation(playerADefaults)),
  )
  .add(
    'WaitForWithdrawalConfirmation',
    testState(channelStates.waitForWithdrawalConfirmation(playerADefaults)),
  )
  .add(
    'AcknowledgeWithdrawalSuccess',
    testState(channelStates.acknowledgeWithdrawalSuccess(playerADefaults)),
  );

storiesOf('Wallet Screens / Challenging', module)
  .add('ApproveChallenge', testState(channelStates.approveChallenge(playerADefaults)))
  .add(
    'WaitForChallengeInitiation',
    testState(channelStates.waitForChallengeInitiation(playerADefaults)),
  )
  .add(
    'WaitForChallengeSubmission',
    testState(channelStates.waitForChallengeSubmission(playerADefaults)),
  )
  .add(
    'WaitForChallengeConfirmation',
    testState(channelStates.waitForChallengeConfirmation(playerADefaults)),
  )
  .add(
    'WaitForResponseOrTimeout',
    testState(channelStates.waitForResponseOrTimeout(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeResponse',
    testState(channelStates.acknowledgeChallengeResponse(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeTimeout',
    testState(channelStates.acknowledgeChallengeTimeout(playerADefaults)),
  );

storiesOf('Wallet Screens / Responding', module)
  .add('ChooseResponse', testState(channelStates.chooseResponse(playerADefaults)))
  .add(
    'AcknowledgeChallengeTimeout',
    testState(channelStates.challengeeAcknowledgeChallengeTimeOut(playerADefaults)),
  )
  .add('TakeMoveInApp', testState(channelStates.takeMoveInApp(playerADefaults)))
  .add('InitiateResponse', testState(channelStates.initiateResponse(playerADefaults)))
  .add(
    'WaitForResponseSubmission',
    testState(channelStates.waitForResponseSubmission(playerADefaults)),
  )
  .add(
    'WaitForResponseConfirmation',
    testState(channelStates.waitForResponseConfirmation(playerADefaults)),
  )
  .add(
    'AcknowledgeChallengeComplete',
    testState(channelStates.acknowledgeChallengeComplete(playerADefaults)),
  );

storiesOf('Wallet Screens / Closing', module)
  .add('ApproveConclude', testState(channelStates.approveConclude(playerADefaults)))
  .add('WaitForOpponentConclude', testState(channelStates.waitForOpponentConclude(playerADefaults)))
  .add('AcknowledgeConcludeSuccess', testState(channelStates.approveCloseOnChain(playerADefaults)));

storiesOf('Wallet Landing Page', module).add(
  'Landing Page',
  testState(walletStates.waitForLogin({ outboxState: {} })),
);
