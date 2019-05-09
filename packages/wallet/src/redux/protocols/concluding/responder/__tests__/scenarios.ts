import * as states from '../../state';

import {
  preSuccessState,
  preFailureState,
  successTrigger,
  failureTrigger,
} from '../../../defunding/__tests__';
import * as actions from '../actions';
import * as channelScenarios from '../../../../__tests__/test-scenarios';
import { CommitmentType, Commitment } from 'fmg-core';
import { ChannelState } from '../../../../channel-store';
import { setChannel, EMPTY_SHARED_DATA } from '../../../../state';
import { channelFromCommitments } from '../../../../channel-store/channel-state/__tests__';

// -----------------
// Channel Scenarios
// -----------------
const { channelId, bsAddress: address, bsPrivateKey: privateKey } = channelScenarios;

const { signedCommitment20, signedCommitment21, signedCommitment22 } = channelScenarios;
const theirTurn = channelFromCommitments(
  signedCommitment20,
  signedCommitment21,
  address,
  privateKey,
);
const ourTurn = channelFromCommitments(signedCommitment21, signedCommitment22, address, privateKey);

const concludeCommitment: Commitment = {
  ...signedCommitment21.commitment,
  channel: channelScenarios.channel,
  commitmentCount: 0,
  commitmentType: CommitmentType.Conclude,
  appAttributes: '0x0',
  turnNum: 23,
};

// --------
// Defaults
// --------
const processId = 'processId';
const storage = (channelState: ChannelState) => setChannel(EMPTY_SHARED_DATA, channelState);

const defaults = { processId, channelId };

// ------
// States
// ------
const approveConcluding = states.responderApproveConcluding(defaults);
const decideDefund = states.responderDecideDefund(defaults);
const waitForDefund = states.responderWaitForDefund({
  ...defaults,
  defundingState: preSuccessState,
});
const waitForDefund2 = states.responderWaitForDefund({
  ...defaults,
  defundingState: preFailureState,
});
const acknowledgeSuccess = states.responderAcknowledgeSuccess(defaults);
const success = states.success();

// -------
// Actions
// -------
const concludeSent = actions.concludeSent(processId);
const defundChosen = actions.defundChosen(processId);
const concludingImpossibleAcknowledged = actions.acknowledged(processId);
const acknowledged = actions.acknowledged(processId);

// -------
// Scenarios
// -------
export const happyPath = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    approveConcluding,
    decideDefund,
    waitForDefund,
    acknowledgeSuccess,
    success,
  },
  actions: {
    concludeSent,
    defundChosen,
    successTrigger,
    acknowledged,
  },
  commitments: {
    concludeCommitment,
  },
};

export const channelDoesntExist = {
  ...defaults,
  initialProps: {
    commitment: signedCommitment20,
  },
  storage: storage(ourTurn),
  states: {
    acknowledgeFailure: states.responderAcknowledgeFailure({
      ...defaults,
      reason: 'ChannelDoesntExist',
    }),
    failure: states.failure({ reason: 'ChannelDoesntExist' }),
  },
  actions: {
    acknowledged,
  },
};

export const concludingNotPossible = {
  ...defaults,
  storage: storage(theirTurn),
  states: {
    acknowledgeFailure: states.responderAcknowledgeFailure({ ...defaults, reason: 'NotYourTurn' }),
    failure: states.failure({ reason: 'NotYourTurn' }),
  },
  actions: {
    concludingImpossibleAcknowledged,
    acknowledged,
  },
};

export const defundingFailed = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    waitForDefund2,
    acknowledgeFailure: states.responderAcknowledgeFailure({
      ...defaults,
      reason: 'DefundFailed',
    }),
    failure: states.failure({ reason: 'DefundFailed' }),
  },
  actions: {
    acknowledged,
    failureTrigger,
  },
};
