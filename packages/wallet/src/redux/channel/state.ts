import { OpeningState } from '../states/channels/opening';
import { RunningState } from '../states/channels/running';
import { FundingChannelState } from '../states/channels/funding';
import { ChallengingState } from '../states/channels/challenging';
import { RespondingState } from '../states/channels/responding';
import { WithdrawingState } from '../states/channels/withdrawing';
import { ClosingState } from '../states/channels/closing';

export type OpenedChannelState =
  | FundingChannelState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export type ChannelState = OpeningState | OpenedChannelState;

export * from '../states/channels/opening';
export * from '../states/channels/running';
export * from '../states/channels/funding';
export * from '../states/channels/challenging';
export * from '../states/channels/responding';
export * from '../states/channels/withdrawing';
export * from '../states/channels/closing';
