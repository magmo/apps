import * as scenarios from './scenarios';
import { instigatorConcludingReducer, initialize, ReturnVal } from '../reducer';
import { InstigatorConcludingStateType } from '../states';
import { SharedData } from '../../../../state';
import { Commitment } from '../../../../../domain';
import { CONCLUDE_INSTIGATED } from '../../../actions';
import { expectThisMessageAndCommitmentSent } from '../../../../__tests__/helpers';
import { FailureReason } from '../../state';

describe('[ Happy path ]', () => {
  const scenario = scenarios.happyPath;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'InstigatorApproveConcluding');
  });
  describe('when in ApproveConcluding', () => {
    const state = scenario.states.approveConcluding;
    const action = scenario.actions.concludeSent;
    const result = instigatorConcludingReducer(state, storage, action);

    itSendsConcludeInstigated(result.storage, scenario.commitments.concludeCommitment);
    itTransitionsTo(result, 'InstigatorWaitForOpponentConclude');
  });

  describe('when in WaitForOpponentConclude', () => {
    const state = scenario.states.waitForOpponentConclude;
    const action = scenario.actions.concludeReceived;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsTo(result, 'InstigatorAcknowledgeConcludeReceived');
  });

  describe('when in AcknowledgeConcludeReceived', () => {
    const state = scenario.states.acknowledgeConcludeReceived;
    const action = scenario.actions.defundChosen;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsTo(result, 'InstigatorWaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const state = scenario.states.waitForDefund;
    const action = scenario.actions.successTrigger;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsTo(result, 'InstigatorAcknowledgeSuccess');
  });

  describe('when in AcknowledgeSuccess', () => {
    const state = scenario.states.acknowledgeSuccess;
    const action = scenario.actions.acknowledged;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsTo(result, 'Success');
  });
});

describe('[ Channel doesnt exist ]', () => {
  const scenario = scenarios.channelDoesntExist;
  const { processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize('NotInitializedChannelId', processId, storage);

    itTransitionsToAcknowledgeFailure(result, 'ChannelDoesntExist');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.states.acknowledgeFailure;
    const action = scenario.actions.acknowledged;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsToFailure(result, 'ChannelDoesntExist');
  });
});

describe('[ Concluding Not Possible ]', () => {
  const scenario = scenarios.concludingNotPossible;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsToAcknowledgeFailure(result, 'NotYourTurn');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.states.acknowledgeFailure;
    const action = scenario.actions.acknowledged;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsToFailure(result, 'NotYourTurn');
  });
});

describe('[ Concluding Cancelled ]', () => {
  const scenario = scenarios.concludingCancelled;
  const { storage } = scenario;

  describe('when in ApproveConcluding', () => {
    const state = scenario.states.approveConcluding;
    const action = scenario.actions.cancelled;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsToFailure(result, 'ConcludeCancelled');
  });
});

describe('[ Defunding Failed ]', () => {
  const scenario = scenarios.defundingFailed;
  const { storage } = scenario;

  describe('when in WaitForDefund', () => {
    const state = scenario.states.waitForDefund2;
    const action = scenario.actions.failureTrigger;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsToAcknowledgeFailure(result, 'DefundFailed');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.states.acknowledgeFailure;
    const action = scenario.actions.acknowledged;
    const result = instigatorConcludingReducer(state, storage, action);

    itTransitionsToFailure(result, 'DefundFailed');
  });
});

function itSendsConcludeInstigated(storage: SharedData, commitment: Commitment) {
  it('sends a conclude instigated message with the correct commitment', () => {
    expectThisMessageAndCommitmentSent(storage, commitment, CONCLUDE_INSTIGATED);
  });
}

function itTransitionsTo(result: ReturnVal, type: InstigatorConcludingStateType) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}

function itTransitionsToFailure(result: ReturnVal, reason: FailureReason) {
  it(`transitions to Failure with reason ${reason}`, () => {
    expect(result.state.type).toEqual('Failure');
    if (result.state.type === 'Failure') {
      expect(result.state.reason).toEqual(reason);
    }
  });
}

function itTransitionsToAcknowledgeFailure(result: ReturnVal, reason: FailureReason) {
  it(`transitions to AcknowledgeFailure with reason ${reason}`, () => {
    expect(result.state.type).toEqual('InstigatorAcknowledgeFailure');
    if (result.state.type === 'InstigatorAcknowledgeFailure') {
      expect(result.state.reason).toEqual(reason);
    }
  });
}
