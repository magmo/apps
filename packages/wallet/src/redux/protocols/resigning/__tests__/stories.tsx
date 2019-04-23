import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import { Resigning } from '..';
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

addStories(scenarios.happyPath, 'Resigning / Happy Path');
addStories(scenarios.resignationNotPossible, 'Resigning / Resignation Not Possible');
addStories(scenarios.closedButNotDefunded, 'Resigning / Closed But Not Defunded');

function addStories(scenario, chapter) {
  Object.keys(scenario.states).forEach(key => {
    storiesOf(chapter, module).add(key, render(<Resigning state={scenario.states[key]} />));
  });
}



