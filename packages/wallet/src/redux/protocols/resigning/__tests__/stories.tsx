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

const happyPath = {
  ApproveResignation: scenarios.happyPath.states.approveResignation,
  WaitForOpponentConclude: scenarios.happyPath.states.waitForOpponentConclude,
  AcknowledgeChannelClosed: scenarios.happyPath.states.acknowledgeChannelClosed,
  WaitForDefund: scenarios.happyPath.states.waitForDefund,
};

const resignationNotPossible = {
  AcknowledgeResignationImpossible:
    scenarios.resignationNotPossible.states.acknowledgeResignationImpossible,
};

const closedButNotDefunded = {
  WaitForDefund: scenarios.closedButNotDefunded.states.waitForDefund,
};

addStories(happyPath, 'Resigning / Happy Path');
addStories(resignationNotPossible, 'Resigning / Resignation Not Possible');
addStories(closedButNotDefunded, 'Resigning / Closed But Not Defunded');

function addStories(collection, chapter) {
  Object.keys(collection).map(storyName => {
    const state = collection[storyName];
    storiesOf(chapter, module).add(storyName, render(<Resigning state={state} />));
  });
}
