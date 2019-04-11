import * as actions from '../../actions';
import * as states from '../../state';
import { indirectFundingReducer } from '../reducer';
import * as playerA from '../player-a/reducer';
import * as playerB from '../player-b/reducer';

import * as scenarios from '../../__tests__/test-scenarios';
import { PlayerIndex } from '../../types';
import * as indirectFundingStates from '../../indirect-funding/state';
import { EMPTY_OUTBOX_STATE } from '../../outbox/state';
import { EMPTY_CHANNEL_STATE } from '../../channel-state/state';
const { channelId, ledgerChannel } = scenarios;
const emptySharedData = {
  outboxState: EMPTY_OUTBOX_STATE,
  channelState: EMPTY_CHANNEL_STATE,
};

const defaultState = {
  protocolState: indirectFundingStates.playerB.waitForApproval(channelId),
  sharedData: emptySharedData,
};

describe('when FUNDING_REQUESTED arrives', () => {
  it('works as player A', () => {
    const action = actions.indirectFunding.fundingRequested(channelId, PlayerIndex.A);
    const updatedState = indirectFundingReducer(defaultState, action);

    expect(updatedState.protocolState).toMatchObject({
      type: states.indirectFunding.playerA.WAIT_FOR_APPROVAL,
    });
  });

  it('works as player B', () => {
    const action = actions.indirectFunding.fundingRequested(channelId, PlayerIndex.B);
    const updatedState = indirectFundingReducer(defaultState, action);

    expect(updatedState.protocolState).toMatchObject({
      type: states.indirectFunding.playerB.WAIT_FOR_APPROVAL,
    });
  });
});

describe('when in a player A state', () => {
  const player = PlayerIndex.A;
  it('delegates to the playerAReducer', () => {
    const state = {
      ...defaultState,
      protocolState: states.indirectFunding.playerA.waitForApproval({ channelId, player }),
    };
    const action = actions.indirectFunding.playerA.strategyApproved(
      channelId,
      ledgerChannel.channelType,
    );

    const playerAReducer = jest.fn();
    Object.defineProperty(playerA, 'playerAReducer', { value: playerAReducer });

    indirectFundingReducer(state, action);
    expect(playerAReducer).toHaveBeenCalledWith(state, action);
  });
});

describe('when in a player B state', () => {
  const player = PlayerIndex.B;
  it('delegates to the playerBReducer', () => {
    const state = {
      ...defaultState,
      protocolState: states.indirectFunding.playerB.waitForApproval({ channelId, player }),
    };
    const action = actions.indirectFunding.playerB.strategyProposed(channelId);

    const playerBReducer = jest.fn();
    Object.defineProperty(playerB, 'playerBReducer', { value: playerBReducer });

    indirectFundingReducer(state, action);
    expect(playerBReducer).toHaveBeenCalledWith(state, action);
  });
});
