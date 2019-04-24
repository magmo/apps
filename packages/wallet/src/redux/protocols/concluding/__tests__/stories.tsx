import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import { Concluding } from '..';
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

addStories(scenarios.happyPath, 'Concluding / Happy Path');
addStories(scenarios.concludingNotPossible, 'Concluding / Concluding Impossible');

function addStories(scenario, chapter) {
  Object.keys(scenario.states).forEach(key => {
    storiesOf(chapter, module).add(key, render(<Concluding state={scenario.states[key]} />));
  });
}
