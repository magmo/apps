import * as states from '../states';
import { initialize } from '../reducer';
import * as scenarios from './scenarios';
import { CommitmentType } from '../../../../domain';

const itTransitionsTo = (
  result: { protocolState: states.AdvanceChannelState },
  type: states.AdvanceChannelStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.protocolState.type).toEqual(type);
  });
};

describe('sending preFundSetup as A', () => {
  const scenario = scenarios.newChannelAsA;

  describe('when initializing', () => {
    const { channelId } = scenario;
    const { sharedData } = scenario.commitmentSent;
    const result = initialize(channelId, sharedData, CommitmentType.PreFundSetup);
    itTransitionsTo(result, 'AdvanceChannel.CommitmentSent');
  });
});
