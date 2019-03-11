import { OpeningState } from './opening';
import { RunningState } from './running';
import { FundingChannelState, FundingState } from './funding';
import { ChallengingState } from './challenging';
import { RespondingState } from './responding';
import { WithdrawingState } from './withdrawing';
import { ClosingState } from './closing';

export type ChannelState =
  | OpeningState
  | FundingChannelState
  | FundingState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export * from './opening';
export * from './running';
export * from './funding';
export * from './challenging';
export * from './responding';
export * from './withdrawing';
export * from './closing';
