import { Commitment } from 'fmg-core/lib/commitment';
import { SharedData, ProtocolStateWithSharedData } from '..';
import * as states from './state';
import * as actions from './actions';
export const initialize = (
  challengeCommitment: Commitment,
  processId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.RespondingState> => {
  return {
    protocolState: states.waitForApproval({ processId, challengeCommitment }),
    sharedData,
  };
};

export const respondingReducer = (
  protocolState: states.RespondingState,
  sharedData: SharedData,
  action: actions.RespondingAction,
): ProtocolStateWithSharedData<states.RespondingState> => {
  return { protocolState, sharedData };
};
