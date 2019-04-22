import { SharedData } from '../../state';
import { ProtocolStateWithSharedData } from '..';
import * as states from './state';
import { DefundingAction } from './actions';

export const initialize = (
  processId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.DefundingState> => {
  return { protocolState: states.success(), sharedData };
};

export const defundingReducer = (
  protocolState: states.DefundingState,
  sharedData: SharedData,
  action: DefundingAction,
): ProtocolStateWithSharedData<states.DefundingState> => {
  return { protocolState, sharedData };
};
