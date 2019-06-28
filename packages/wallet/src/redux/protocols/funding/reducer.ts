import { ProtocolReducer, ProtocolStateWithSharedData } from '..';
import { unreachable } from '../../../utils/reducer-utils';
import { SharedData } from '../../state';
import { TwoPartyPlayerIndex } from '../../types';
import { NewLedgerFundingAction } from '../new-ledger-funding/actions';
import { getOpponentAddress, getOurAddress } from '../reducer-helpers';
import * as actions from './actions';
import { fundingReducer as playerAReducer, initialize as initializeA } from './player-a/reducer';
import * as playerAStates from './player-a/states';
import { fundingReducer as playerBReducer, initialize as initializeB } from './player-b/reducer';
import * as states from './states';

export function initialize(
  sharedData: SharedData,
  channelId: string,
  processId: string,
  playerIndex: TwoPartyPlayerIndex,
): ProtocolStateWithSharedData<states.FundingState> {
  const opponentAddress = getOpponentAddress(channelId, sharedData);
  const ourAddress = getOurAddress(channelId, sharedData);
  switch (playerIndex) {
    case TwoPartyPlayerIndex.A:
      return initializeA(sharedData, processId, channelId, ourAddress, opponentAddress);
    case TwoPartyPlayerIndex.B:
      return initializeB(sharedData, processId, channelId, ourAddress, opponentAddress);
    default:
      return unreachable(playerIndex);
  }
}

export const fundingReducer: ProtocolReducer<states.FundingState> = (
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingAction | NewLedgerFundingAction,
): ProtocolStateWithSharedData<states.FundingState> => {
  if (playerAStates.isFundingState(protocolState)) {
    if (!actions.isPlayerAFundingAction(action)) {
      return { protocolState, sharedData };
    }
    return playerAReducer(protocolState, sharedData, action);
  } else {
    if (!actions.isPlayerBFundingAction(action)) {
      return { protocolState, sharedData };
    }
    return playerBReducer(protocolState, sharedData, action);
  }
};
