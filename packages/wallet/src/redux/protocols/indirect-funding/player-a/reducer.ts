import * as states from './state';

import * as actions from '../../../actions';

import { SharedData } from '../../../state';
import { IndirectFundingState } from '../state';
import { ProtocolStateWithSharedData } from '../..';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

export function initialize(channelId: string, sharedData: SharedData): ReturnVal {
  const protocolState = states.aWaitForPreFundSetup1({
    channelId,
    ledgerId: 'ledgerid',
  });
  return { protocolState, sharedData };
}

export function playerAReducer(
  protocolState: states.PlayerAState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal {
  return { protocolState, sharedData };
}
