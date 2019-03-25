import { OpeningState } from './opening/state';
import { FundingState } from './funding/state';

// export type OpenedState =
//   | FundingState
//   | RunningState
//   | ChallengingState
//   | RespondingState
//   | WithdrawingState
//   | ClosingState;

export type LedgerChannelStatus = OpeningState | FundingState;

export * from './opening/state';
export * from './funding/state';
