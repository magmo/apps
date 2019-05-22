import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import DirectFunding from '../container';
import * as scenarios from './scenarios';
import * as storybookUtils from '../../../../__stories__/index';
import StatusBarLayout from '../../../../components/status-bar-layout';
import { storiesOf } from '@storybook/react';

const render = container => () => {
  // todo: rework this modal stuff
  return (
    <Provider store={storybookUtils.fakeStore({})}>
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
// Convention is to add all scenarios here, and allow the
// addStories function to govern what ends up being shown.
addStories(scenarios.aHappyPath, 'Indirect Defunding / PlayerA / Happy Path');

function addStories(scenario, chapter) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      storiesOf(chapter, module).add(key, render(<DirectFunding state={scenario[key].state} />));
    }
  });
}
