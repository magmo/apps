import * as indirectFundingState from './state';
import * as actions from '../../actions';
import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex } from '../../types';
import { ProtocolStateWithSharedData, ProtocolReducer } from '../';
import { playerAReducer, initialize as initializeA } from './player-a/reducer';
import { playerBReducer, initialize as initializeB } from './player-b/reducer';
import { SharedData } from '../../state';
import { ChannelStatus } from '../../channel-state/state';

type ReturnVal = ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState>;

export function initialize(
  channel: ChannelStatus,
  sharedData: SharedData,
  consensusLibrary: string, // todo: make a global constant
): ReturnVal {
  const { ourIndex } = channel;
  switch (ourIndex) {
    case PlayerIndex.A:
      return initializeA(channel, sharedData, consensusLibrary);
    case PlayerIndex.B:
      return initializeB(channel, sharedData);
    default:
      // todo: this should never happen
      return unreachable(ourIndex);
  }
}

export const indirectFundingReducer: ProtocolReducer<indirectFundingState.IndirectFundingState> = (
  protocolState: indirectFundingState.IndirectFundingState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<indirectFundingState.IndirectFundingState> => {
  switch (protocolState.player) {
    case PlayerIndex.A:
      return playerAReducer(protocolState, sharedData, action);
    case PlayerIndex.B:
      return playerBReducer(protocolState, sharedData, action);

    default:
      return unreachable(protocolState);
  }
};
