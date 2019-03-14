import { OpeningState } from '../states/channels/openingState';
import { RunningState } from '../states/channels/runningState';
import { FundingChannelState } from '../states/channels/fundingState';
import { ChallengingState } from '../states/channels/challengingState';
import { RespondingState } from '../states/channels/respondingState';
import { WithdrawingState } from '../states/channels/withdrawingState';
import { ClosingState } from '../states/channels/closingState';

export type OpenedChannelState =
  | FundingChannelState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export type ChannelState = OpeningState | OpenedChannelState;

export * from '../states/channels/openingState';
export * from '../states/channels/runningState';
export * from '../states/channels/fundingState';
export * from '../states/channels/challengingState';
export * from '../states/channels/respondingState';
export * from '../states/channels/withdrawingState';
export * from '../states/channels/closingState';
