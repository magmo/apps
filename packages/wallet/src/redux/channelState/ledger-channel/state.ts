import { OpeningState } from './opening/state';
import { FundingState } from './funding/state';
import { BaseInitializingChannelStatus } from '../state';

// export type OpenedState =
//   | FundingState
//   | RunningState
//   | ChallengingState
//   | RespondingState
//   | WithdrawingState
//   | ClosingState;

export type LedgerChannelStatus = OpeningState | FundingState;
export interface InitializingLedgerChannelStatus extends BaseInitializingChannelStatus {
  appChannelId: string;
}
export * from './opening/state';
export * from './funding/state';
