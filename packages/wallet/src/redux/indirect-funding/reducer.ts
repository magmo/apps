import * as indirectFundingState from './state';
import * as actions from '../actions';
import { unreachable } from '../../utils/reducer-utils';
import { PlayerIndex } from '../types';
import { ProtocolStateWithSharedData, ProtocolReducer } from '../protocols';
import { playerAReducer } from './player-a/reducer';
import { playerBReducer } from './player-b/reducer';

export const indirectFundingReducer: ProtocolReducer<indirectFundingState.IndirectFundingState> = (
  state: ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState> => {
  if (action.type === actions.indirectFunding.FUNDING_REQUESTED) {
    return fundingRequestedReducer(state, action);
  }
  switch (state.protocolState.player) {
    case PlayerIndex.A:
      return playerAReducer(
        state as ProtocolStateWithSharedData<indirectFundingState.playerA.PlayerAState>,
        action,
      );
    case PlayerIndex.B:
      return playerBReducer(
        state as ProtocolStateWithSharedData<indirectFundingState.playerB.PlayerBState>,
        action,
      );

    default:
      return unreachable(state.protocolState);
  }
};

function fundingRequestedReducer(
  state: ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState>,
  action: actions.indirectFunding.FundingRequested,
): ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState> {
  const { channelId, playerIndex: player } = action;
  switch (player) {
    case PlayerIndex.A:
      return {
        ...state,
        protocolState: indirectFundingState.playerA.waitForApproval({ channelId, player }),
      };
    case PlayerIndex.B:
      return {
        ...state,
        protocolState: indirectFundingState.playerB.waitForApproval({ channelId, player }),
      };
    default:
      return unreachable(player);
  }
}
