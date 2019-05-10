import * as scenarios from './scenarios';
import { instigatorConcludingReducer, initialize, ReturnVal } from '../reducer';
import { InstigatorConcludingStateType } from '../states';
import { FailureReason } from '../../state';
import { SharedData } from '../../../../state';
import { Commitment } from '../../../../../domain';
import { CONCLUDE_INSTIGATED } from '../../../actions';
import { expectThisMessageAndCommitmentSent } from '../../../../__tests__/helpers';

describe('[ Happy path ]', () => {
  const scenario = scenarios.happyPath;
  const { channelId, processId } = scenario;

  describe('when initializing', () => {
    const { store } = scenario.initialize;
    const result = initialize(channelId, processId, store);
    itTransitionsTo(result, 'InstigatorApproveConcluding');
  });
  describe('when in ApproveConcluding', () => {
    const { state, action, store, reply } = scenario.approveConcluding;
    const result = instigatorConcludingReducer(state, store, action);

    itSendsConcludeInstigated(result.storage, reply);
    itTransitionsTo(result, 'InstigatorWaitForOpponentConclude');
  });

  describe('when in WaitForOpponentConclude', () => {
    const { state, action, store } = scenario.waitforOpponentConclude;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsTo(result, 'InstigatorAcknowledgeConcludeReceived');
  });

  describe('when in AcknowledgeConcludeReceived', () => {
    const { state, action, store } = scenario.acknowledgeConcludeReceived;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsTo(result, 'InstigatorWaitForDefund');
  });

  describe('when in WaitForDefund', () => {
    const { state, action, store } = scenario.waitForDefund;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsTo(result, 'InstigatorAcknowledgeSuccess');
  });

  describe('when in AcknowledgeSuccess', () => {
    const { state, action, store } = scenario.acknowledgeSuccess;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsTo(result, 'Success');
  });
});

describe('[ Channel doesnt exist ]', () => {
  const scenario = scenarios.channelDoesntExist;
  const { channelId, processId } = scenario;

  describe('when initializing', () => {
    const { store } = scenario.initialize;
    const result = initialize(channelId, processId, store);

    itTransitionsToAcknowledgeFailure(result, 'ChannelDoesntExist');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action, store } = scenario.acknowledgeFailure;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToFailure(result, 'ChannelDoesntExist');
  });
});

describe('[ Concluding Not Possible ]', () => {
  const scenario = scenarios.concludingNotPossible;
  const { channelId, processId } = scenario;

  describe('when initializing', () => {
    const { store } = scenario.initialize;
    const result = initialize(channelId, processId, store);

    itTransitionsToAcknowledgeFailure(result, 'NotYourTurn');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action, store } = scenario.acknowledgeFailure;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToFailure(result, 'NotYourTurn');
  });
});

describe('[ Concluding Not Possible ]', () => {
  const scenario = scenarios.concludingNotPossible;
  const { channelId, processId } = scenario;

  describe('when initializing', () => {
    const { store } = scenario.initialize;
    const result = initialize(channelId, processId, store);

    itTransitionsToAcknowledgeFailure(result, 'NotYourTurn');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action, store } = scenario.acknowledgeFailure;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToFailure(result, 'NotYourTurn');
  });
});

describe('[ Concluding Cancelled ]', () => {
  const scenario = scenarios.concludingCancelled;

  describe('when in ApproveConcluding', () => {
    const { state, action, store } = scenario.approveConcluding;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToFailure(result, 'ConcludeCancelled');
  });
});

describe('[ Defund failed ]', () => {
  const scenario = scenarios.defudFailed;

  describe('when in WaitForDefund', () => {
    const { state, action, store } = scenario.waitForDefund;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToAcknowledgeFailure(result, 'DefundFailed');
  });

  describe('when in AcknowledgeFailure', () => {
    const { state, action, store } = scenario.acknowledgeFailure;
    const result = instigatorConcludingReducer(state, store, action);

    itTransitionsToFailure(result, 'DefundFailed');
  });
});

/////////////
// Helpers //
/////////////

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
