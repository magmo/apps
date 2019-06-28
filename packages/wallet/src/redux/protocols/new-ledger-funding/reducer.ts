import { ProtocolStateWithSharedData } from '..';
import { unreachable } from '../../../utils/reducer-utils';
import { ChannelState } from '../../channel-store';
import { SharedData } from '../../state';
import { TwoPartyPlayerIndex } from '../../types';
import { NewLedgerFundingAction } from './actions';
import { initialize as initializeA, playerAReducer } from './player-a/reducer';
import { isPlayerAState } from './player-a/states';
import { initialize as initializeB, playerBReducer } from './player-b/reducer';
import { NewLedgerFundingState, NonTerminalNewLedgerFundingState } from './states';

type ReturnVal = ProtocolStateWithSharedData<NewLedgerFundingState>;

export function initialize(
  processId: string,
  channel: ChannelState,
  sharedData: SharedData,
): ReturnVal {
  // todo: would be nice to avoid casting here
  const ourIndex: TwoPartyPlayerIndex = channel.ourIndex;

  switch (ourIndex) {
    case TwoPartyPlayerIndex.A:
      return initializeA(processId, channel.channelId, sharedData);
    case TwoPartyPlayerIndex.B:
      return initializeB(processId, channel.channelId, sharedData);
    default:
      return unreachable(ourIndex);
  }
}

export const newLedgerFundingReducer = (
  protocolState: NonTerminalNewLedgerFundingState,
  sharedData: SharedData,
  action: NewLedgerFundingAction,
): ReturnVal => {
  if (isPlayerAState(protocolState)) {
    return playerAReducer(protocolState, sharedData, action);
  } else {
    return playerBReducer(protocolState, sharedData, action);
  }
};
