import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import DirectFundingContainer from '../container';
import { aDepositsBDepositsAHappyStates } from './scenarios';
import * as storybookUtils from '../../../../__stories__/index';

const render = state => () => {
  const container = <DirectFundingContainer directFundingState={state} />;
  return (
    <Provider store={storybookUtils.fakeStore({})}>
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

const directFundingScreens = {
  NotSafeToDeposit: aDepositsBDepositsAHappyStates.notSafeToDeposit,
  WaitForTransactionSubmissionStart: aDepositsBDepositsAHappyStates.waitForDepositTransactionStart,
  WaitForTransactionSubmissionEnd: aDepositsBDepositsAHappyStates.waitForDepositTransactionEnd,
  WaitForFundingConfirmation: aDepositsBDepositsAHappyStates.waitForFundingConfirmation,
  ChannelFunded: aDepositsBDepositsAHappyStates.fundingSuccess,
};

storybookUtils.addStoriesFromCollection(directFundingScreens, 'Direct Funding Happy Path', render);
