import { IndirectFundingState } from './indirect-funding/state';
import { DirectFundingState } from './direct-funding/state';
import { SharedData } from '../state';

export type ProtocolState = IndirectFundingState | DirectFundingState;

export type ProtocolReducer<T extends ProtocolState> = (
  protocolState: T,
  sharedData: SharedData,
  action,
) => ProtocolStateWithSharedData<T>;

export interface ProtocolStateWithSharedData<T extends ProtocolState> {
  protocolState: T;
  sharedData: SharedData;
}
