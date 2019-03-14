import { OpeningState } from './openingState';
import { RunningState } from './runningState';
import { FundingChannelState } from './fundingState';
import { ChallengingState } from './challengingState';
import { RespondingState } from './respondingState';
import { WithdrawingState } from './withdrawingState';
import { ClosingState } from './closingState';

export type OpenedChannelState =
  | FundingChannelState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export type ChannelState = OpeningState | OpenedChannelState;

export * from './openingState';
export * from './runningState';
export * from './fundingState';
export * from './challengingState';
export * from './respondingState';
export * from './withdrawingState';
export * from './closingState';
