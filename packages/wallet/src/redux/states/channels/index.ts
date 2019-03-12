import { OpeningState } from './opening';
import { RunningState } from './running';
import { FundingChannelState } from './funding';
import { ChallengingState } from './challenging';
import { RespondingState } from './responding';
import { WithdrawingState } from './withdrawing';
import { ClosingState } from './closing';

export type OpenedChannelState =
  | FundingChannelState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export type ChannelState = OpeningState | OpenedChannelState;

export * from './opening';
export * from './running';
export * from './funding';
export * from './challenging';
export * from './responding';
export * from './withdrawing';
export * from './closing';
