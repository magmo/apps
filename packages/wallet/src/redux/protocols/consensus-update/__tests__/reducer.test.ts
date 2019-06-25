import * as scenarios from './scenarios';
import { initialize, consensusUpdateReducer } from '../reducer';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { describeScenarioStep } from '../../../__tests__/helpers';
import { getLastMessage } from '../../../state';
import { SignedCommitment } from '../../../../domain';

describe('Two Players', () => {
  describe('Player A Happy Path', () => {
    const scenario = scenarios.twoPlayerAHappyPath;
    describe('when initializing', () => {
      const {
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      } = scenario.initialize;
      const result = initialize(
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      );
      itSendsMessage(result, scenario.initialize.reply);
      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });
    describeScenarioStep(scenario.waitForUpdate, () => {
      const { sharedData, action, state } = scenario.waitForUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Success');
    });
  });

  describe('Player B Happy Path', () => {
    const scenario = scenarios.twoPlayerAHappyPath;
    describe('when initializing', () => {
      const {
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      } = scenario.initialize;
      const result = initialize(
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      );

      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });
    describeScenarioStep(scenario.waitForUpdate, () => {
      const { sharedData, action, state } = scenario.waitForUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Success');
    });
  });

  describe('Player A Invalid Commitment', () => {
    const scenario = scenarios.twoPlayerACommitmentRejected;

    describeScenarioStep(scenario.waitForUpdate, () => {
      const { sharedData, action, state } = scenario.waitForUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Failure');
    });
  });

  describe('Player B Invalid Commitment', () => {
    const scenario = scenarios.twoPlayerBCommitmentRejected;

    describeScenarioStep(scenario.waitForUpdate, () => {
      const { sharedData, action, state } = scenario.waitForUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Failure');
    });
  });
});

describe('Three Players', () => {
  describe('Player A Happy Path', () => {
    const scenario = scenarios.threePlayerAHappyPath;
    describe('when initializing', () => {
      const {
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      } = scenario.initialize;
      const result = initialize(
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      );

      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
      itSendsMessage(result, scenario.initialize.reply);
    });

    describe("when receiving Player B's update", () => {
      const { sharedData, action, state } = scenario.waitForPlayerBUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });

    describe("when receiving hub's update", () => {
      const { sharedData, action, state } = scenario.waitForHubUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Success');
    });
  });

  describe('Player B Happy Path', () => {
    const scenario = scenarios.threePlayerBHappyPath;
    describe('when initializing', () => {
      const {
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      } = scenario.initialize;
      const result = initialize(
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      );

      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });

    describe("when receiving Player A's update", () => {
      const { sharedData, action, state, reply } = scenario.waitForPlayerAUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
      itSendsMessage(result, reply);
    });

    describe("when receiving hub's update", () => {
      const { sharedData, action, state } = scenario.waitForHubUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.Success');
    });
  });

  describe('Hub Happy Path', () => {
    const scenario = scenarios.threePlayerHubHappyPath;
    describe('when initializing', () => {
      const {
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      } = scenario.initialize;
      const result = initialize(
        processId,
        channelId,
        proposedAllocation,
        proposedDestination,
        sharedData,
      );

      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });

    describe("when receiving Player A's update", () => {
      const { sharedData, action, state } = scenario.waitForPlayerAUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itTransitionsTo(result, 'ConsensusUpdate.WaitForUpdate');
    });

    describe("when receiving Player B's update", () => {
      const { sharedData, action, state, reply } = scenario.waitForPlayerBUpdate;
      const result = consensusUpdateReducer(state, sharedData, action);
      itSendsMessage(result, reply);
      itTransitionsTo(result, 'ConsensusUpdate.Success');
    });
  });
});

function itTransitionsTo(
  result: ProtocolStateWithSharedData<states.ConsensusUpdateState>,
  type: states.ConsensusUpdateStateType,
) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}

function itSendsMessage(
  state: ProtocolStateWithSharedData<states.ConsensusUpdateState>,
  message: SignedCommitment,
) {
  it('sends a message', () => {
    const lastMessage = getLastMessage(state.sharedData);
    if (lastMessage && 'messagePayload' in lastMessage) {
      const dataPayload = lastMessage.messagePayload;
      // This is yuk. The data in a message is currently of 'any' type..
      if (!('signedCommitments' in dataPayload)) {
        fail('No signedCommitments in the last message.');
      }

      expect(dataPayload.signedCommitments).toContainEqual(message);
    } else {
      fail('No messages in the outbox.');
    }
  });
}
