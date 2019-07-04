import * as scenarios from './scenarios';
import { initialize, channelSyncReducer } from '../reducer';
import { ChannelSyncState, ChannelSyncStateType } from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { describeScenarioStep, itSendsTheseCommitments } from '../../../__tests__/helpers';
import { SharedData } from '../../../state';
import { getLatestCommitment } from '../../reducer-helpers';
import { SignedCommitment } from '../../../../domain';
describe('Player A has latest', () => {
  const scenario = scenarios.playerAHasLatest;

  describe('when initializing', () => {
    const { sharedData, processId, channelId, reply } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
    itSendsTheseCommitments(result, reply);
  });

  describeScenarioStep(scenario.waitForFirstUpdate, () => {
    const { state, action, sharedData } = scenario.waitForFirstUpdate;
    const result = channelSyncReducer(state, sharedData, action);

    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });
  describeScenarioStep(scenario.waitForSecondUpdate, () => {
    const { state, action, sharedData, channelId, latestCommitment } = scenario.waitForSecondUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itHasStoredCommitment(result.sharedData, channelId, latestCommitment);
    itTransitionsTo(result, 'ChannelSync.Success');
  });
});
describe('Player A is missing a commitment', () => {
  const scenario = scenarios.playerAIsMissingCommitment;

  describe('when initializing', () => {
    const { sharedData, processId, channelId, reply } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
    itSendsTheseCommitments(result, reply);
  });

  describeScenarioStep(scenario.waitForFirstUpdate, () => {
    const { state, action, sharedData } = scenario.waitForFirstUpdate;
    const result = channelSyncReducer(state, sharedData, action);

    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });
  describeScenarioStep(scenario.waitForSecondUpdate, () => {
    const { state, action, sharedData, channelId, latestCommitment } = scenario.waitForSecondUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itHasStoredCommitment(result.sharedData, channelId, latestCommitment);
    itTransitionsTo(result, 'ChannelSync.Success');
  });
});

describe('Player B has latest', () => {
  const scenario = scenarios.playerBHasLatest;

  describe('when initializing', () => {
    const { sharedData, processId, channelId } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });

  describeScenarioStep(scenario.waitForFirstUpdate, () => {
    const { state, action, sharedData, reply } = scenario.waitForFirstUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itSendsTheseCommitments(result, reply);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });
  describeScenarioStep(scenario.waitForSecondUpdate, () => {
    const { state, action, sharedData, channelId, latestCommitment } = scenario.waitForSecondUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itHasStoredCommitment(result.sharedData, channelId, latestCommitment);
    itTransitionsTo(result, 'ChannelSync.Success');
  });
});
describe('Player B is missing a commitment', () => {
  const scenario = scenarios.playerBIsMissingCommitment;

  describe('when initializing', () => {
    const { sharedData, processId, channelId } = scenario.initialize;
    const result = initialize(processId, channelId, sharedData);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });

  describeScenarioStep(scenario.waitForFirstUpdate, () => {
    const { state, action, sharedData, reply } = scenario.waitForFirstUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itSendsTheseCommitments(result, reply);
    itTransitionsTo(result, 'ChannelSync.WaitForUpdate');
  });
  describeScenarioStep(scenario.waitForSecondUpdate, () => {
    const { state, action, sharedData, channelId, latestCommitment } = scenario.waitForSecondUpdate;
    const result = channelSyncReducer(state, sharedData, action);
    itHasStoredCommitment(result.sharedData, channelId, latestCommitment);
    itTransitionsTo(result, 'ChannelSync.Success');
  });
});

function itHasStoredCommitment(
  sharedData: SharedData,
  channelId: string,
  latestCommitment: SignedCommitment,
) {
  it('has the latest commitment', () => {
    expect(getLatestCommitment(channelId, sharedData)).toEqual(latestCommitment.commitment);
  });
}
function itTransitionsTo(
  result: ProtocolStateWithSharedData<ChannelSyncState>,
  type: ChannelSyncStateType,
) {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
}
