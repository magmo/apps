import React from 'react';
import { storiesOf } from '@storybook/react';
import WalletContainer from '../containers/wallet';
import { Provider } from 'react-redux';
import * as walletStates from '../redux/state';

import {
  dummyWaitForLogin,
  dummyWaitForAdjudicator,
  dummyWaitForMetaMask,
} from './dummy-wallet-states';
import {
  dummyWaitForApproval,
  dummyWaitForPreFundSetup1,
  dummyWaitForPostFundSetup1,
  dummyWaitForLedgerUpdate1,
  dummyWaitForDirectFunding,
} from './a-dummy-wallet-states';
import {
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

const walletStateRender = state => () => {
  return (
    <Provider store={fakeStore(state)}>
      <WalletContainer position="center" />
    </Provider>
  );
};

const twinWalletStateRender = (
  aState: walletStates.Initialized,
  bState: walletStates.Initialized,
) => () => {
  return (
    <div>
      Player A x Player B
      <Provider store={fakeStore(aState)}>
        <WalletContainer position="left" />
      </Provider>
      <Provider store={fakeStore(bState)}>
        <WalletContainer position="right" />
      </Provider>
    </div>
  );
};

function addTwinStoriesFromCollection(collection, chapter, renderer = twinWalletStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(
      storyName,
      renderer(collection[storyName].a, collection[storyName].b),
    );
  });
}

function addStoriesFromCollection(collection, chapter, renderer = walletStateRender) {
  Object.keys(collection).map(storyName => {
    storiesOf(chapter, module).add(storyName, renderer(collection[storyName]));
  });
}

const WalletScreensNotInitialized = {
  WaitForLogIn: dummyWaitForLogin,
  WaitForAdjudicator: dummyWaitForAdjudicator,
  WaitForMetaMask: dummyWaitForMetaMask,
};

addStoriesFromCollection(WalletScreensNotInitialized, 'Not Initialized ');

const NetworkStatuses = {
  Mainnet: { ...dummyWaitForLogin, networkId: 1 },
  Kovan: { ...dummyWaitForLogin, networkId: 42 },
  Ropsten: { ...dummyWaitForLogin, networkId: 3 },
  Rinkeby: { ...dummyWaitForLogin, networkId: 4 },
  Ganache: { ...dummyWaitForLogin, networkId: 5777 },
};

addStoriesFromCollection(NetworkStatuses, 'Network Statuses');

const TwinWalletScreensIndirectFunding = {
  'Both in WaitForApproval': { a: dummyWaitForApproval, b: dummyWaitForApproval },
  'Both in WaitForPreFundSetup': { a: dummyWaitForPreFundSetup1, b: dummyWaitForPreFundSetup0 },
  'Both in WaitForDirectFunding': { a: dummyWaitForDirectFunding, b: dummyWaitForDirectFunding },
  'Both in WaitForPostFundSetup': { a: dummyWaitForPostFundSetup1, b: dummyWaitForPostFundSetup0 },
  'Both in WaitForLedgerUpdate': { a: dummyWaitForLedgerUpdate1, b: dummyWaitForLedgerUpdate0 },
};

addTwinStoriesFromCollection(
  TwinWalletScreensIndirectFunding,
  'Indirect Funding Process',
  twinWalletStateRender,
);

storiesOf('Landing Page', module).add('Landing Page', walletStateRender({}));
