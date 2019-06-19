import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import { CommitmentType } from '../../../../domain';
import { expectThisCommitmentSent } from '../../../__tests__/helpers';

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
  const { channelId } = scenario;

  describe('when initializing', () => {
    const { sharedData, commitment } = scenario.initialize;
    const result = initialize(channelId, sharedData, CommitmentType.PreFundSetup);
    itTransitionsTo(result.protocolState, 'AdvanceChannel.CommitmentSent');
    expectThisCommitmentSent(result, commitment);
  });

  describe('when receiving prefund commitments from b', () => {
    const { sharedData } = scenario.receiveFromB;
    const result = initialize(channelId, sharedData, CommitmentType.PreFundSetup);
    itTransitionsTo(result.protocolState, 'AdvanceChannel.CommitmentSent');
  });

  describe('when receiving prefund commitments from the hub', () => {
    const { state, sharedData, action } = scenario.receiveFromHub;
    const result = reducer(state, sharedData, action).protocolState;
    itTransitionsTo(result, 'AdvanceChannel.Success');
  });
});
