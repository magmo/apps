import { OpeningState } from './opening/state';
import { RunningState } from './runningState';
import { FundingChannelState } from './funding/state';
import { ChallengingState } from './challenging/state';
import { RespondingState } from './respondingState';
import { WithdrawingState } from './withdrawingState';
import { ClosingState } from './closing/state';

export type OpenedChannelState =
  | FundingChannelState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export type ChannelState = OpeningState | OpenedChannelState;

export * from './opening/state';
export * from './runningState';
export * from './funding/state';
export * from './challenging/state';
export * from './respondingState';
export * from './withdrawingState';
export * from './closing/state';
