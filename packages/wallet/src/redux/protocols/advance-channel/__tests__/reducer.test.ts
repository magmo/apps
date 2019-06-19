import * as states from '../states';
import { initialize, reducer } from '../reducer';
import * as scenarios from './scenarios';
import { CommitmentType } from '../../../../domain';
import { expectTheseCommitmentsSent } from '../../../__tests__/helpers';

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

  describe.only('when initializing', () => {
    const { sharedData, commitments, args } = scenario.initialize;
    const result = initialize(sharedData, CommitmentType.PreFundSetup, args);
    itTransitionsTo(result.protocolState, 'AdvanceChannel.CommitmentSent');
    expectTheseCommitmentsSent(result, commitments);
    // expectThisChannelStored(result, channelId);
    // expectThisChannelRegistered(result, channelId);
  });

  describe('when receiving prefund commitments from b', () => {
    const { sharedData, args } = scenario.receiveFromB;
    const result = initialize(sharedData, CommitmentType.PreFundSetup, args);
    itTransitionsTo(result.protocolState, 'AdvanceChannel.CommitmentSent');
  });

  describe('when receiving prefund commitments from the hub', () => {
    const { state, sharedData, action } = scenario.receiveFromHub;
    const result = reducer(state, sharedData, action).protocolState;
    itTransitionsTo(result, 'AdvanceChannel.Success');
  });
});
