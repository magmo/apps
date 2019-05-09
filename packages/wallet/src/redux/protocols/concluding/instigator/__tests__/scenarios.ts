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

// -----------------
// Channel Scenarios
// -----------------
const { channelId, asAddress: address, asPrivateKey: privateKey } = channelScenarios;
import { ChannelState } from '../../../../channel-store';
import { setChannel, EMPTY_SHARED_DATA } from '../../../../state';
import { channelFromCommitments } from '../../../../channel-store/channel-state/__tests__';

const { signedCommitment19, signedCommitment20, signedCommitment21 } = channelScenarios;
const theirTurn = channelFromCommitments(
  signedCommitment19,
  signedCommitment20,
  address,
  privateKey,
);
const ourTurn = channelFromCommitments(signedCommitment20, signedCommitment21, address, privateKey);

const concludeCommitment: Commitment = {
  ...signedCommitment21.commitment,
  channel: channelScenarios.channel,
  commitmentCount: 0,
  commitmentType: CommitmentType.Conclude,
  appAttributes: '0x0',
  turnNum: 22,
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
const approveConcluding = states.instigatorApproveConcluding(defaults);
const waitForOpponentConclude = states.instigatorWaitForOpponentConclude(defaults);
const acknowledgeConcludeReceived = states.instigatorAcknowledgeConcludeReceived(defaults);
const waitForDefund = states.instigatorWaitForDefund({
  ...defaults,
  defundingState: preSuccessState,
});
const waitForDefund2 = states.instigatorWaitForDefund({
  ...defaults,
  defundingState: preFailureState,
});
const acknowledgeSuccess = states.instigatorAcknowledgeSuccess(defaults);
const success = states.success();

// -------
// Actions
// -------
const concludeSent = actions.concludeSent(processId);
const concludeReceived = actions.concludeReceived(processId);
const defundChosen = actions.defundChosen(processId);
const concludingImpossibleAcknowledged = actions.acknowledged(processId);
const cancelled = actions.cancelled(processId);
const acknowledged = actions.acknowledged(processId);

// -------
// Scenarios
// -------
export const happyPath = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    approveConcluding,
    waitForOpponentConclude,
    acknowledgeConcludeReceived,
    waitForDefund,
    acknowledgeSuccess,
    success,
  },
  actions: {
    concludeSent,
    concludeReceived,
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
  storage: storage(ourTurn),
  states: {
    acknowledgeFailure: states.instigatorAcknowledgeFailure({
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
    acknowledgeFailure: states.instigatorAcknowledgeFailure({ ...defaults, reason: 'NotYourTurn' }),
    failure: states.failure({ reason: 'NotYourTurn' }),
  },
  actions: {
    concludingImpossibleAcknowledged,
    acknowledged,
  },
};

export const concludingCancelled = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    approveConcluding,
    failure: states.failure({ reason: 'ConcludeCancelled' }),
  },
  actions: {
    cancelled,
  },
};

export const defundingFailed = {
  ...defaults,
  storage: storage(ourTurn),
  states: {
    waitForDefund2,
    acknowledgeFailure: states.instigatorAcknowledgeFailure({
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
