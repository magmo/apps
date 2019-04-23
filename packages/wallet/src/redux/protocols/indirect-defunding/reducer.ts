import { ProtocolStateWithSharedData } from '..';
import { SharedData } from '../../state';
import * as states from './state';
import { IndirectDefundingAction } from './actions';

export const initialize = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  return { protocolState: states.success(), sharedData };
};

export const indirectDefundingReducer = (
  protocolState: states.IndirectDefundingState,
  sharedData: SharedData,
  action: IndirectDefundingAction,
): ProtocolStateWithSharedData<states.IndirectDefundingState> => {
  return { protocolState, sharedData };
};
