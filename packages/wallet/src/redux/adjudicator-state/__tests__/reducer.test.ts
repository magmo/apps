import * as actions from '../../actions';
import * as testScenarios from '../../../domain/commitments/__tests__';
const { channelId } = testScenarios;
import { adjudicatorStateReducer } from '../reducer';
// tslint:disable: no-shadowed-variable
const gameState1 = testScenarios.appState({ turnNum: 19 });
const createChallengeState = (channelId: string, expiryTime) => {
  return {
    channelId,
    balance: '0x0',
    finalized: false,
    challenge: {
      challengeState: gameState1,
      expiresAt: expiryTime,
    },
  };
};

describe('adjudicator state reducer', () => {
  const state = {};
  describe('when a challenge created event is received', () => {
    const expiryTime = 1234;
    const action = actions.challengeCreatedEvent({
      channelId,
      signedState: gameState1,
      finalizedAt: expiryTime,
    });
    const updatedState = adjudicatorStateReducer(state, action);
    it('sets a challenge', () => {
      expect(updatedState[channelId].challenge).toEqual({
        challengeCommitment: gameState1,
        expiresAt: expiryTime,
      });
    });
  });

  describe('when a funding received event is received', () => {
    const action = actions.fundingReceivedEvent({
      processId: 'processId',
      protocolLocator: [],
      channelId,
      totalForDestination: '0x06',
      amount: '0x5',
    });
    const updatedState = adjudicatorStateReducer(state, action);
    it('sets the balance', () => {
      expect(updatedState[channelId].balance).toEqual('0x06');
    });
    const secondUpdatedState = adjudicatorStateReducer(state, action);
    it('handles a duplicate funding event', () => {
      expect(secondUpdatedState[channelId].balance).toEqual('0x06');
    });
  });

  describe('when a challenge expired event is received', () => {
    const state = {
      [channelId]: createChallengeState(channelId, 123),
    };
    const action = actions.challengeExpiredEvent({
      processId: '0x0',
      protocolLocator: [],
      channelId,
      timestamp: 1,
    });
    const updatedState = adjudicatorStateReducer(state, action);

    it('clears the challenge', () => {
      expect(updatedState[channelId].challenge).toBeUndefined();
    });

    it('marks the challenge as finalized', () => {
      expect(updatedState[channelId].finalized).toBe(true);
    });
  });

  describe('when a refute event arrives', () => {
    const state = {
      [channelId]: createChallengeState(channelId, 123),
    };
    const action = actions.refutedEvent({
      processId: '0x0',
      protocolLocator: [],
      channelId,
      refuteState: gameState1,
    });
    const updatedState = adjudicatorStateReducer(state, action);

    it('clears the challenge', () => {
      expect(updatedState[channelId].challenge).toBeUndefined();
    });
  });

  describe('when a respond with move event arrives', () => {
    const state = {
      [channelId]: createChallengeState(channelId, 123),
    };
    const action = actions.respondWithMoveEvent({
      processId: '0x0',
      protocolLocator: [],
      channelId,
      responseState: gameState1,
    });
    const updatedState = adjudicatorStateReducer(state, action);

    it('clears the challenge', () => {
      expect(updatedState[channelId].challenge).toBeUndefined();
    });
  });

  describe('when a concluded event arrives', () => {
    const state = {};
    const action = actions.concludedEvent({ channelId });
    const updatedState = adjudicatorStateReducer(state, action);

    it('marks a channel as finalized', () => {
      expect(updatedState[channelId].finalized).toBe(true);
    });
  });
});
