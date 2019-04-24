import { FundingState as PlayerAFundingState } from './player-a/states';
import { FundingState as PlayerBFundingState } from './player-b/states';

import * as playerA from './player-a/states';
import * as playerB from './player-b/states';

export type FundingState = PlayerAFundingState | PlayerBFundingState;

export { playerA, playerB };

export function isPlayerAFundingState(state: FundingState): state is PlayerAFundingState {
  return (
    state.type === playerA.WAIT_FOR_FUNDING ||
    state.type === playerA.WAIT_FOR_POSTFUND_SETUP ||
    state.type === playerA.WAIT_FOR_STRATEGY_CHOICE ||
    state.type === playerA.WAIT_FOR_STRATEGY_RESPONSE ||
    state.type === playerA.WAIT_FOR_SUCCESS_CONFIRMATION
  );
}
