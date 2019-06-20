import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import { CommitmentType } from '../../../../domain';
import {
  expectTheseCommitmentsSent,
  itStoresThisCommitment,
  itRegistersThisChannel,
  itSendsNoMessage,
} from '../../../__tests__/helpers';

const itTransitionsTo = (
  result: states.AdvanceChannelState,
  type: states.AdvanceChannelStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};

describe('sending preFundSetup as A', () => {
  const scenario = scenarios.newChannelAsA;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, commitments, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(
      processId,
      sharedData,
      CommitmentType.PreFundSetup,
      args,
    );

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    expectTheseCommitmentsSent(result, commitments);
    itStoresThisCommitment(result, commitments[0]);
    itRegistersThisChannel(result, channelId, processId);
  });

  describe('when receiving prefund commitments from b', () => {
    const { commitments, state, sharedData, action } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
    itStoresThisCommitment(result, commitments[1]);
  });

  describe('when receiving prefund commitments from the hub', () => {
    const { state, sharedData, action, commitments } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisCommitment(result, commitments[2]);
    itSendsNoMessage(result);
  });
});

describe('sending preFundSetup as B', () => {
  const scenario = scenarios.newChannelAsB;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(
      processId,
      sharedData,
      CommitmentType.PreFundSetup,
      args,
    );

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itSendsNoMessage(result);
  });

  describe('when receiving prefund commitments from A', () => {
    const { state, sharedData, action, commitments } = scenario.receiveFromA;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itStoresThisCommitment(result, commitments[1]);
    expectTheseCommitmentsSent(result, commitments);
    itRegistersThisChannel(result, channelId, processId);
  });

  describe('when receiving prefund commitments from the hub', () => {
    const { state, sharedData, action, commitments } = scenario.receiveFromHub;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisCommitment(result, commitments[2]);
    itSendsNoMessage(result);
  });
});

describe('sending preFundSetup as Hub', () => {
  const scenario = scenarios.newChannelAsHub;
  const { processId, channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(
      processId,
      sharedData,
      CommitmentType.PreFundSetup,
      args,
    );

    itTransitionsTo(protocolState, 'AdvanceChannel.ChannelUnknown');
    itSendsNoMessage(result);
  });

  describe('when receiving prefund commitments from B', () => {
    const { state, sharedData, action, commitments } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisCommitment(result, commitments[2]);
    expectTheseCommitmentsSent(result, commitments);
    itRegistersThisChannel(result, channelId, processId);
  });
});

describe('sending postFundSetup as A', () => {
  const scenario = scenarios.existingChannelAsA;
  const { processId, commitmentType } = scenario;

  describe('when initializing', () => {
    const { sharedData, commitments, args } = scenario.initialize;
    const { protocolState, sharedData: result } = initialize(
      processId,
      sharedData,
      commitmentType,
      args,
    );

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    expectTheseCommitmentsSent(result, commitments);
    itStoresThisCommitment(result, commitments[2]);
  });

  describe('when receiving postFund commitments from b', () => {
    const { commitments, state, sharedData, action } = scenario.receiveFromB;
    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.CommitmentSent');
    itSendsNoMessage(result);
    itStoresThisCommitment(result, commitments[2]);
  });

  describe('when receiving postfund commitments from the hub', () => {
    const { state, sharedData, action, commitments } = scenario.receiveFromHub;

    const { protocolState, sharedData: result } = reducer(state, sharedData, action);

    itTransitionsTo(protocolState, 'AdvanceChannel.Success');
    itStoresThisCommitment(result, commitments[2]);
    itSendsNoMessage(result);
  });
});
