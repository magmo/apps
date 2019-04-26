import * as states from '../state';
import { PlayerBState } from '../state';

import * as actions from '../../../actions';

import { ProtocolStateWithSharedData } from '../../';
import { SharedData } from '../../../state';
import { IndirectFundingState } from '../state';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

export function initialize(channelId: string, sharedData: SharedData): ReturnVal {
  // todo: check that channel exists?
  return { protocolState: states.bWaitForPreFundSetup0({ channelId }), sharedData };
}

export function playerBReducer(
  protocolState: PlayerBState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal {
  return { protocolState, sharedData };
}
