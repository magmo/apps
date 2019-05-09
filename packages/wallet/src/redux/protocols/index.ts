import { SharedData } from '../state';
import { ChallengingState } from './challenging/states';
import { ConcludingState as ConcludingInstigatorState } from './concluding/instigator/states';
import { ConcludingState as ConcludingResponderState } from './concluding/responder/states';
import { DirectFundingState } from './direct-funding/state';
import { FundingState } from './funding/states';
import { IndirectFundingState } from './indirect-funding/state';
import { RespondingState } from './responding/state';
import { WithdrawalState } from './withdrawing/states';
import { ApplicationState } from './application/states';
import { IndirectDefundingState } from './indirect-defunding/state';
import { DefundingState } from './defunding/states';

export type ProtocolState =
  | ApplicationState
  | IndirectFundingState
  | DirectFundingState
  | WithdrawalState
  | RespondingState
  | FundingState
  | DefundingState
  | ChallengingState
  | ConcludingInstigatorState
  | ConcludingResponderState
  | IndirectDefundingState;

export type ProtocolReducer<T extends ProtocolState> = (
  protocolState: T,
  sharedData: SharedData,
  action,
) => ProtocolStateWithSharedData<T>;

export interface ProtocolStateWithSharedData<T extends ProtocolState> {
  protocolState: T;
  sharedData: SharedData;
}
