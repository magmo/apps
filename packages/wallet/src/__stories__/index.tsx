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
  requestedTotalFunds: bigNumberify(1000000000000000).toHexString(),
};
const playerADefaults = {
  ...defaults,
  ourIndex: 0,
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
};
const playerBDefaults = {
  ...defaults,
  ourIndex: 1,
  requestedYourDeposit: bigNumberify(500000000000000).toHexString(),
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

const initializedWalletState = walletStates.channelInitialized({
  ...walletStates.waitForLogin(),
  unhandledAction: undefined,
  outboxState: {},
  channelState: channelStates.approveFunding({ ...playerADefaults }),
  networkId: 4,
  adjudicator: '',
  uid: '',
});

// Want to return top level wallet state, not the channel state
function walletStateFromChannelState<T extends channelStates.ChannelState>(
  channelState: T,
  networkId?: number,
): walletStates.WalletState {
  return {
    ...initializedWalletState,
    channelState: { ...channelState },
    networkId: networkId || 3,
  };
}

const testState = state => () => (
  <Provider store={fakeStore(state)}>
    <Wallet />
  </Provider>
);

storiesOf('Network Status', module)
  .add(
    'Mainnet',
    testState(walletStateFromChannelState(channelStates.approveFunding({ ...playerADefaults }), 1)),
  )
  .add(
    'Kovan',
    testState(
      walletStateFromChannelState(channelStates.approveFunding({ ...playerADefaults }), 42),
    ),
  )
  .add(
    'Ropsten',
    testState(walletStateFromChannelState(channelStates.approveFunding({ ...playerADefaults }), 3)),
  )
  .add(
    'Rinkeby',
    testState(walletStateFromChannelState(channelStates.approveFunding({ ...playerADefaults }), 4)),
  )
  .add(
    'Ganache',
    testState(
      walletStateFromChannelState(channelStates.approveFunding({ ...playerADefaults }), 5777),
    ),
  );
storiesOf('Wallet Screens / Funding / Player A', module)
  .add(
    'ApproveFunding',
    testState(walletStateFromChannelState(channelStates.approveFunding(playerADefaults))),
  )
  .add(
    'AWaitForDepositToBeSentToMetaMask',
    testState(
      walletStateFromChannelState(channelStates.aWaitForDepositToBeSentToMetaMask(playerADefaults)),
    ),
  )
  .add(
    'ASubmitDepositInMetaMask',
    testState(walletStateFromChannelState(channelStates.aSubmitDepositInMetaMask(playerADefaults))),
  )
  .add(
    'AWaitForDepositConfirmation',
    testState(
      walletStateFromChannelState(channelStates.aWaitForDepositConfirmation(playerADefaults)),
    ),
  )
  .add(
    'AWaitForOpponentDeposit',
    testState(walletStateFromChannelState(channelStates.aWaitForOpponentDeposit(playerADefaults))),
  )
  .add(
    'AWaitForPostFundSetup',
    testState(walletStateFromChannelState(channelStates.aWaitForPostFundSetup(playerADefaults))),
  )
  .add(
    'AcknowledgeFundingSuccess',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeFundingSuccess(playerADefaults)),
    ),
  );

storiesOf('Wallet Screens / Funding / Player B', module)
  .add(
    'ApproveFunding',
    testState(walletStateFromChannelState(channelStates.approveFunding(playerBDefaults))),
  )
  .add(
    'BWaitForOpponentDeposit',
    testState(walletStateFromChannelState(channelStates.bWaitForOpponentDeposit(playerBDefaults))),
  )
  .add(
    'BWaitForDepositToBeSentToMetaMask',
    testState(
      walletStateFromChannelState(channelStates.bWaitForDepositToBeSentToMetaMask(playerBDefaults)),
    ),
  )
  .add(
    'BSubmitDepositInMetaMask',
    testState(walletStateFromChannelState(channelStates.bSubmitDepositInMetaMask(playerBDefaults))),
  )
  .add(
    'BWaitForDepositConfirmation',
    testState(
      walletStateFromChannelState(channelStates.bWaitForDepositConfirmation(playerBDefaults)),
    ),
  )
  .add(
    'BWaitForPostFundSetup',
    testState(walletStateFromChannelState(channelStates.bWaitForPostFundSetup(playerBDefaults))),
  )
  .add(
    'AcknowledgeFundingSuccess',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeFundingSuccess(playerBDefaults)),
    ),
  );

storiesOf('Wallet Screens / Withdrawing', module)
  .add(
    'ApproveWithdrawal',
    testState(walletStateFromChannelState(channelStates.approveWithdrawal(playerADefaults))),
  )
  .add(
    'WaitForWithdrawalInitiation',
    testState(
      walletStateFromChannelState(channelStates.waitForWithdrawalInitiation(playerADefaults)),
    ),
  )
  .add(
    'WaitForWithdrawalConfirmation',
    testState(
      walletStateFromChannelState(channelStates.waitForWithdrawalConfirmation(playerADefaults)),
    ),
  )
  .add(
    'AcknowledgeWithdrawalSuccess',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeWithdrawalSuccess(playerADefaults)),
    ),
  );

storiesOf('Wallet Screens / Challenging', module)
  .add(
    'ApproveChallenge',
    testState(walletStateFromChannelState(channelStates.approveChallenge(playerADefaults))),
  )
  .add(
    'WaitForChallengeInitiation',
    testState(
      walletStateFromChannelState(channelStates.waitForChallengeInitiation(playerADefaults)),
    ),
  )
  .add(
    'WaitForChallengeSubmission',
    testState(
      walletStateFromChannelState(channelStates.waitForChallengeSubmission(playerADefaults)),
    ),
  )
  .add(
    'WaitForChallengeConfirmation',
    testState(
      walletStateFromChannelState(channelStates.waitForChallengeConfirmation(playerADefaults)),
    ),
  )
  .add(
    'WaitForResponseOrTimeout',
    testState(walletStateFromChannelState(channelStates.waitForResponseOrTimeout(playerADefaults))),
  )
  .add(
    'AcknowledgeChallengeResponse',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeChallengeResponse(playerADefaults)),
    ),
  )
  .add(
    'AcknowledgeChallengeTimeout',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeChallengeTimeout(playerADefaults)),
    ),
  );

storiesOf('Wallet Screens / Responding', module)
  .add(
    'ChooseResponse',
    testState(walletStateFromChannelState(channelStates.chooseResponse(playerADefaults))),
  )
  .add(
    'AcknowledgeChallengeTimeout',
    testState(
      walletStateFromChannelState(
        channelStates.challengeeAcknowledgeChallengeTimeOut(playerADefaults),
      ),
    ),
  )
  .add(
    'TakeMoveInApp',
    testState(walletStateFromChannelState(channelStates.takeMoveInApp(playerADefaults))),
  )
  .add(
    'InitiateResponse',
    testState(walletStateFromChannelState(channelStates.initiateResponse(playerADefaults))),
  )
  .add(
    'WaitForResponseSubmission',
    testState(
      walletStateFromChannelState(channelStates.waitForResponseSubmission(playerADefaults)),
    ),
  )
  .add(
    'WaitForResponseConfirmation',
    testState(
      walletStateFromChannelState(channelStates.waitForResponseConfirmation(playerADefaults)),
    ),
  )
  .add(
    'AcknowledgeChallengeComplete',
    testState(
      walletStateFromChannelState(channelStates.acknowledgeChallengeComplete(playerADefaults)),
    ),
  );

storiesOf('Wallet Screens / Closing', module)
  .add(
    'ApproveConclude',
    testState(walletStateFromChannelState(channelStates.approveConclude(playerADefaults))),
  )
  .add(
    'WaitForOpponentConclude',
    testState(walletStateFromChannelState(channelStates.waitForOpponentConclude(playerADefaults))),
  )
  .add(
    'AcknowledgeConcludeSuccess',
    testState(walletStateFromChannelState(channelStates.approveCloseOnChain(playerADefaults))),
  );

storiesOf('Wallet Landing Page', module).add(
  'Landing Page',
  testState(walletStates.waitForLogin({ outboxState: {} })),
);
