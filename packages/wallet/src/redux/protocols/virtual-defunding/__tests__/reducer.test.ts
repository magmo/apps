import * as scenarios from './scenarios';
import { initialize, reducer } from '../reducer';
import * as states from '../states';
import { scenarioStepDescription, itSendsTheseCommitments } from '../../../__tests__/helpers';
import { bigNumberify } from 'ethers/utils';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator/lib/consensus-app';
import { asAddress, bsAddress } from '../../../../domain/commitments/__tests__';
import { HUB_ADDRESS } from '../../../../constants';
const itTransitionsTo = (
  result: states.VirtualDefundingState,
  type: states.VirtualDefundingStateType,
) => {
  it(`transitions to ${type}`, () => {
    expect(result.type).toEqual(type);
  });
};

describe('happyPath', () => {
  const scenario = scenarios.happyPath;

  describe('Initialization', () => {
    const result = initialize(scenario.initialize);

    itTransitionsTo(result.protocolState, 'VirtualDefunding.WaitForJointChannelUpdate');

    const appAttributes = bytesFromAppAttributes({
      proposedAllocation: [
        bigNumberify(1).toHexString(),
        bigNumberify(3).toHexString(),
        bigNumberify(4).toHexString(),
      ],
      proposedDestination: [asAddress, bsAddress, HUB_ADDRESS],
      furtherVotesRequired: 2,
    });

    itSendsTheseCommitments(result.sharedData, [
      { commitment: { turnNum: 4 } },
      { commitment: { turnNum: 5 } },
      { commitment: { turnNum: 6, appAttributes } },
    ]);
  });

  describe(scenarioStepDescription(scenario.waitForJointChannel), () => {
    const { sharedData, state, action } = scenario.waitForJointChannel;
    const result = reducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'VirtualDefunding.WaitForLedgerChannelUpdate');

    const appAttributes = bytesFromAppAttributes({
      proposedAllocation: [bigNumberify(1).toHexString(), bigNumberify(3).toHexString()],
      proposedDestination: [asAddress, HUB_ADDRESS],
      furtherVotesRequired: 1,
    });

    itSendsTheseCommitments(result.sharedData, [
      {
        commitment: {
          turnNum: 7,
        },
      },
      {
        commitment: {
          turnNum: 8,
          appAttributes,
        },
      },
    ]);
  });

  describe(scenarioStepDescription(scenario.waitForLedgerChannel), () => {
    const { sharedData, state, action } = scenario.waitForLedgerChannel;
    const result = reducer(state, sharedData, action);
    itTransitionsTo(result.protocolState, 'VirtualDefunding.Success');
  });
});
