import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import { fakeStore } from '../../../../__stories__/index';
import StatusBarLayout from '../../../../components/status-bar-layout';
import * as scenarios from './scenarios';
import { Withdrawal } from '../container';

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

addStories(scenarios.happyPath, 'Withdrawal / Happy path');
addStories(scenarios.withdrawalRejected, 'Withdrawal / User rejects withdrawal ');
addStories(scenarios.failedTransaction, 'Withdrawal / Transaction fails');
addStories(scenarios.channelNotClosed, 'Withdrawal / Channel not closed');

function addStories(scenario, chapter) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      storiesOf(chapter, module).add(key, render(<Withdrawal state={scenario[key].state} />));
    }
  });
}
