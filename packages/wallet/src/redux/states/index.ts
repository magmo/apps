import { OpeningState } from './channels/opening';
import { RunningState } from './channels/running';
import { FundingState } from './channels/funding';
import { ChallengingState } from './channels/challenging';
import { RespondingState } from './channels/responding';
import { WithdrawingState } from './channels/withdrawing';
import { ClosingState } from './channels/closing';
import { SharedWalletState } from './shared';

export type ChannelState =
  | OpeningState
  | FundingState
  | RunningState
  | ChallengingState
  | RespondingState
  | WithdrawingState
  | ClosingState;

export * from './initializingChannel';
export * from './initializing';
export * from './opening';
export * from './running';
export * from './funding';
export * from './challenging';
export * from './responding';
export * from './withdrawing';
export * from './closing';
export { SharedWalletState };
