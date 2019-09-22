import * as walletStates from '../redux/state';
import * as scenarios from '../domain/commitments/__tests__';
import * as states from '../redux/state';

const { channelId, channelNonce, libraryAddress, participants } = scenarios;
const preFundSignedState1 = scenarios.appState({ turnNum: 0 });
const preFundSignedState2 = scenarios.appState({ turnNum: 1 });
export const defaultParams = {
  adjudicator: 'adj-address',
  channelId,
  channelNonce,
  libraryAddress,
  participants,
  uid: 'uid',
  signedStates: [preFundSignedState1, preFundSignedState2],
  turnNumRecord: preFundSignedState2.state.turnNum,
  networkId: 3,
  challengeExpiry: 0,
  transactionHash: '0x0',
  userAddress: '0x0',
  funded: false,
};

////////////////////////////
// WALLET NOT INITIALIZED //
////////////////////////////

export const dummyWaitForLogin: walletStates.WalletState = walletStates.waitForLogin();
export const dummyWaitForMetaMask: walletStates.WalletState = walletStates.metaMaskError({
  ...dummyWaitForLogin,
});
//

////////////////////////////
// WALLET INITIALIZED //
////////////////////////////

const defaults = {
  ...scenarios.testEmptySharedData(),
  uid: 'uid',
  processStore: {},
  adjudicatorStore: {},
  address: 'address',
  privateKey: 'privateKey',
};

export const initializedState = states.initialized({ ...defaults });
