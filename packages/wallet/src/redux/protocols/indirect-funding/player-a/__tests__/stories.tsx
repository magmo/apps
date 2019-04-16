import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import IndirectFundingContainer from '../../../../../containers/indirect-funding/indirect-funding';
import { happyPath } from './scenarios';

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

const render = container => () => {
  return (
    <Provider store={fakeStore({})}>
      <Modal
        isOpen={true}
        className={'wallet-content-center'}
        overlayClassName={'wallet-overlay-center'}
        ariaHideApp={false}
      >
        {container}
      </Modal>
    </Provider>
  );
};

const indirectFundingScreens = {
  WaitForApproval: happyPath.states.waitForApproval.protocolState,
  WaitForPreFundSetup: happyPath.states.waitForPreFundSetup1.protocolState,
  WaitForDirectFunding: happyPath.states.waitForDirectFunding.protocolState,
  WaitForPostFundSetup: happyPath.states.waitForPostFundSetup1.protocolState,
  WaitForLedgerUpdate: happyPath.states.waitForLedgerUpdate1.protocolState,
  WaitForConsensus: happyPath.states.waitForLedgerUpdate1.protocolState,
};

Object.keys(indirectFundingScreens).map(storyName => {
  const state = indirectFundingScreens[storyName];
  storiesOf('Indirect Funding Player A', module).add(
    storyName,
    render(<IndirectFundingContainer state={state} />),
  );
});
