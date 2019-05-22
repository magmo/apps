import { storiesOf } from '@storybook/react';
import React from 'react';
import Modal from 'react-modal';
import { Provider } from 'react-redux';
import { fakeStore } from '../../../../../__stories__/index';
import StatusBarLayout from '../../../../../components/status-bar-layout';
import * as scenarios from './scenarios';
import { Responder } from '../container';

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

addStories(
  scenarios.respondWithExistingCommitmentHappyPath,
  'Responding / Respond with Existing Move',
);
addStories(scenarios.requireResponseHappyPath, 'Responding / Requires new Response');
addStories(scenarios.refuteHappyPath, 'Responding / Refute challenge');
addStories(scenarios.challengeExpiresChannelDefunded, 'Responding / Challenge Expires (Defunded)');
addStories(
  scenarios.challengeExpiresButChannelNotDefunded,
  'Responding / Challenge Expires (NOT Defunded)',
);
addStories(
  scenarios.challengeExpiresDuringWaitForTransaction,
  'Responding / Challenge Expires during WaitForTransaction',
);
addStories(
  scenarios.challengeExpiresDuringWaitForApproval,
  'Responding / Challenge Expires during WaitForApproval',
);
addStories(
  scenarios.defundActionComesDuringAcknowledgeTimeout,
  'Responding / Challenge Expires during AcknowledgeTimeout',
);

function addStories(scenario, chapter) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      storiesOf(chapter, module).add(key, render(<Responder state={scenario[key].state} />));
    }
  });
}
