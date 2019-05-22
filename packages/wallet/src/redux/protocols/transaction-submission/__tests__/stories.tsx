import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import { TransactionSubmission } from '..';
import { fakeStore } from '../../../../__stories__/index';
import StatusBarLayout from '../../../../components/status-bar-layout';
import * as scenarios from './scenarios';

const render = container => () => {
  // todo: rework this modal stuff
  return (
    <Provider store={fakeStore({})}>
      <Modal
        isOpen={true}
        className={'wallet-content-center'}
        overlayClassName={'wallet-overlay-center'}
        ariaHideApp={false}
      >
        <StatusBarLayout>{container}</StatusBarLayout>
      </Modal>
    </Provider>
  );
};

addStories(scenarios.happyPath, 'Transaction Submission / Happy path');
addStories(scenarios.retryAndApprove, 'Transaction Submission / User approves retry');
addStories(scenarios.retryAndDeny, 'Transaction Submission / User denies retry');
addStories(scenarios.transactionFailed, 'Transaction Submission / Transaction fails');

function addStories(scenario, chapter) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      storiesOf(chapter, module).add(
        key,
        render(<TransactionSubmission transactionName="deposit" state={scenario[key].state} />),
      );
    }
  });
}
