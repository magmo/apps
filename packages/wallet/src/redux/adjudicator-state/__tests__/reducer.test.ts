import * as actions from '../../actions';
import * as testScenarios from '../../__tests__/test-scenarios';
const { gameCommitment1, channelId } = testScenarios;
import { adjudicatorStateReducer } from '../reducer';
// tslint:disable: no-shadowed-variable

const createChallengeState = (channelId: string, expiryTime) => {
  return {
    channelId,
    balance: '0x0',
    finalized: false,
    challenge: {
      challengeCommitment: gameCommitment1,
      expiresAt: expiryTime,
    },
  };
};

describe('adjudicator state reducer', () => {
  const state = {};
  describe('when a challenge created event is received', () => {
    const expiryTime = 1234;
    const action = actions.challengeCreatedEvent(
      channelId,
      testScenarios.gameCommitment1,
      expiryTime,
    );
    const updatedState = adjudicatorStateReducer(state, action);
    it('sets a challenge', () => {
      expect(updatedState[channelId].challenge).toEqual({
        challengeCommitment: gameCommitment1,
        expiresAt: expiryTime,
      });
    });
  });

  describe('when a block mined event is received', () => {
    const channel1 = '0x1';
    const channel2 = '0x2';
    const channel3 = '0x3';
    const beforeBlockTime = 1;
    const blockTime = 2;
    const afterBlockTime = 3;

    const state = {
      [channel1]: createChallengeState(channel1, beforeBlockTime),
      [channel2]: createChallengeState(channel2, blockTime),
      [channel3]: createChallengeState(channel3, afterBlockTime),
    };
    const action = actions.blockMined({
      timestamp: blockTime,
      number: blockTime,
    });
    const updatedState = adjudicatorStateReducer(state, action);
    describe('for a challenge that expires before the block time', () => {
      it('expires the challenge', () => {
        expect(updatedState[channel1].challenge).toBeUndefined();
      });

      it('marks a channel as finalized', () => {
        expect(updatedState[channel1].finalized).toEqual(true);
      });
    });
    describe('for a challenge that expires at the block time', () => {
      it('expires the challenge', () => {
        expect(updatedState[channel2].challenge).toBeUndefined();
      });

      it('marks a channel as finalized', () => {
        expect(updatedState[channel2].finalized).toEqual(true);
      });
    });
    describe('for a challenge that expires after the block time', () => {
      it('does not expire the challenge', () => {
        expect(updatedState[channel3].challenge).toBeDefined();
      });

      it('does not mark a channel as finalized', () => {
        expect(updatedState[channel3].finalized).toEqual(false);
      });
    });
  });

  describe('when a refute event arrives', () => {
    const state = {
      [channelId]: createChallengeState(channelId, 123),
    };
    const action = actions.refutedEvent('0x0', channelId, gameCommitment1);
    const updatedState = adjudicatorStateReducer(state, action);

    it('clears the challenge', () => {
      expect(updatedState[channelId].challenge).toBeUndefined();
    });
  });

  describe('when a respond with move event arrives', () => {
    const state = {
      [channelId]: createChallengeState(channelId, 123),
    };
    const action = actions.respondWithMoveEvent('0x0', channelId, gameCommitment1);
    const updatedState = adjudicatorStateReducer(state, action);

    it('clears the challenge', () => {
      expect(updatedState[channelId].challenge).toBeUndefined();
    });
  });

  describe('when a concluded event arrives', () => {
    const state = {};
    const action = actions.concludedEvent('0x0', channelId);
    const updatedState = adjudicatorStateReducer(state, action);

    it('marks a channel as finalized', () => {
      expect(updatedState[channelId].finalized).toBe(true);
    });
  });
});
