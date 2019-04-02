import * as playerA from './playerA/actions';
import * as playerB from './playerB/actions';
import { CommonAction } from '../actions';

export { playerA, playerB };
export type Action = playerA.Action | playerB.Action | CommonAction;
