import { indirectFundingStateReducer } from '../reducer';
import { SharedIndirectFundingState } from '../../shared/state';

import * as states from '../state';
import * as actions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import { itChangesChannelFundingStatusTo } from '../../../__tests__/helpers';
import { addHex } from '../../../../utils/hex-utils';

const { channelId, twoThree } = scenarios;

const YOUR_DEPOSIT_A = twoThree[1];
const TOTAL_REQUIRED = twoThree.reduce(addHex);

const defaultsForA: SharedIndirectFundingState = {
  fundingType: states.INDIRECT_FUNDING,
  requestedTotalFunds: TOTAL_REQUIRED,
  requestedYourContribution: YOUR_DEPOSIT_A,
  channelId,
  ourIndex: 0,
  channelFundingStatus: '',
};

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn(states.FUNDER_CHANNEL_DOES_NOT_EXIST), () => {
  describe(whenActionArrives(actions.internal.OPEN_CHANNEL_SUCCESS), () => {
    const funderChannelDoesNotExistParams: states.BaseIndirectFundingState = {
      ...defaultsForA,
      channelFundingStatus: states.FUNDER_CHANNEL_DOES_NOT_EXIST,
    };

    const state = states.funderChannelDoesNotExist(funderChannelDoesNotExistParams);
    const action = actions.internal.openChannelSuccess('1234');
    const updatedState = indirectFundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.FUNDER_CHANNEL_EXISTS, updatedState);
  });
});

describe(startingIn(states.FUNDER_CHANNEL_EXISTS), () => {
  describe(whenActionArrives(actions.internal.CONSENSUS_REACHED), () => {
    const funderChannelExistsParams: states.BaseIndirectFundingState = {
      ...defaultsForA,
      channelFundingStatus: states.FUNDER_CHANNEL_EXISTS,
    };

    const state = states.funderChannelExists(funderChannelExistsParams, '1234');
    const action = actions.internal.consenusReached('1234');
    const updatedState = indirectFundingStateReducer(state, action);

    itChangesChannelFundingStatusTo(states.CHANNEL_FUNDED, updatedState);
  });
});
