import * as actions from '../../actions';
import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex } from '../../types';
import { ProtocolStateWithSharedData } from '../';
import { playerAReducer, initialize as initializeA } from './player-a/reducer';
import { playerBReducer, initialize as initializeB } from './player-b/reducer';
import { SharedData } from '../../state';
import { ChannelStatus } from '../../channel-state/state';
import { isPlayerAState } from './player-a/state';
import { NonTerminalIndirectFundingState, IndirectFundingState } from './state';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

export function initialize(channel: ChannelStatus, sharedData: SharedData): ReturnVal {
  // todo: would be nice to avoid casting here
  const ourIndex: PlayerIndex = channel.ourIndex;

  switch (ourIndex) {
    case PlayerIndex.A:
      return initializeA(channel, sharedData);
    case PlayerIndex.B:
      return initializeB(channel, sharedData);
    default:
      return unreachable(ourIndex);
  }
}

export const indirectFundingReducer = (
  protocolState: NonTerminalIndirectFundingState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal => {
  if (isPlayerAState(protocolState)) {
    return playerAReducer(protocolState, sharedData, action);
  } else {
    return playerBReducer(protocolState, sharedData, action);
  }
};
