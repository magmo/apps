import { SharedData } from '../state';
import { ChallengerState } from './dispute/challenger/states';

import { AdvanceChannelState } from './advance-channel';
import { ApplicationState } from './application/states';
import { ConcludingState } from './concluding/states';
import { ConsensusUpdateState } from './consensus-update/states';
import { DefundingState } from './defunding/states';
import { DirectFundingState } from './direct-funding/states';
import { ResponderState } from './dispute/responder/states';
import { ExistingLedgerFundingState } from './existing-ledger-funding/states';
import { FundingState } from './funding/states';
import { IndirectDefundingState } from './indirect-defunding/states';
import { LedgerTopUpState } from './ledger-top-up/states';
import { NewLedgerFundingState } from './new-ledger-funding/states';
import { TransactionSubmissionState } from './transaction-submission';
import { VirtualFundingState } from './virtual-funding/states';
import { WithdrawalState } from './withdrawing/states';

export type ProtocolState =
  | ApplicationState
  | NewLedgerFundingState
  | VirtualFundingState
  | DirectFundingState
  | WithdrawalState
  | ResponderState
  | FundingState
  | DefundingState
  | ChallengerState
  | ConcludingState
  | IndirectDefundingState
  | TransactionSubmissionState
  | ExistingLedgerFundingState
  | LedgerTopUpState
  | ConsensusUpdateState
  | TransactionSubmissionState
  | AdvanceChannelState;

export type ProtocolReducer<T extends ProtocolState> = (
  protocolState: T,
  sharedData: SharedData,
  action,
) => ProtocolStateWithSharedData<T>;

export interface ProtocolStateWithSharedData<T extends ProtocolState> {
  protocolState: T;
  sharedData: SharedData;
}

export function makeLocator(...args: string[]) {
  return args.join('-');
}
