import * as scenarios from './scenarios';
import { challengingReducer, initialize, ReturnVal } from '../reducer';
import { FailureReason } from '../states';

describe('opponent-responds scenario', () => {
  const scenario = scenarios.opponentResponds;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'waitForApproval');
  });
  describe('when in WaitForApproval', () => {
    const state = scenario.waitForApproval;
    const action = scenario.challengeApproved;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'waitForTransaction');
  });
  describe('when in WaitForTransaction', () => {
    // itTransitions to WaitForResponseOrTimeout
  });
  describe('when in WaitForResponseOrTimeout', () => {
    // itTransitions to AcknowledgeResponse
  });
  describe('when in AcknowledgeResponse', () => {
    // itTransitions to SuccessOpen
  });
});

describe('challenge-times-out scenario', () => {
  describe('when in WaitForResponseOrTimeout', () => {
    // itTransitionsTo AcknowledgeTimeout
  });
  describe('when in AcknowledgeTimeout', () => {
    // itTransitionsTo SuccessClosed
  });
});

describe("channel-doesn't-exist scenario", () => {
  const scenario = scenarios.channelDoesntExist;
  const { channelId, processId, storage } = scenario;

  describe('when initializing', () => {
    const result = initialize(channelId, processId, storage);

    itTransitionsTo(result, 'AcknowledgeFailure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });

  describe('when in AcknowledgeFailure', () => {
    const state = scenario.acknowledgeFailure;
    const action = scenario.failureAcknowledged;
    const result = challengingReducer(state, storage, action);

    itTransitionsTo(result, 'Failure');
    itHasFailureReason(result, 'ChannelDoesntExist');
  });
});

describe('user-declines-challenge scenario', () => {
  describe('when in WaitForApproval', () => {
    // itTransitionsTo AcknowledgeFailure
  });
  describe('when in AcknowledgeFailure', () => {
    // itTransitionsTo Unnecessary
  });
});

describe('receive-commitment-while-approving scenario', () => {
  describe('when in WaitForApproval', () => {
    // itTransitionsTo AcknowledgeFailure
  });
  describe('when in AcknowledgeFailure', () => {
    // itTransitionsTo Unnecessary
  });
});

describe('transaction-fails scenario', () => {
  describe('when in WaitForTransaction', () => {
    // itTransitionsTo AcknowledgeFailure
  });
  describe('when in AcknowledgeFailure', () => {
    // itTransitionsTo Unnecessary
  });
});

function itTransitionsTo(result: ReturnVal, type: string) {
  it(`transitions to ${type}`, () => {
    expect(result.state.type).toEqual(type);
  });
}

function itHasFailureReason(result: ReturnVal, reason: FailureReason) {
  it(`has failure reason ${reason}`, () => {
    if ('reason' in result.state) {
      expect(result.state.reason).toEqual(reason);
    } else {
      fail(`State ${result.state.type} doesn't have a failure reason.`);
    }
  });
}
