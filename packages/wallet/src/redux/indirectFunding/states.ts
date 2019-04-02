import * as playerA from './playerA/state';
import * as playerB from './playerB/state';
import { PlayerIndex } from '../types';

export { playerA, playerB };

export type IndirectFundingState = playerA.PlayerAState | playerB.PlayerBState;
