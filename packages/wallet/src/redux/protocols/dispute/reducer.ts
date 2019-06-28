import { ProtocolStateWithSharedData } from '..';
import { Commitment } from '../../../domain';
import { ProtocolAction } from '../../actions';
import { SharedData } from '../../state';
import { isChallengerAction } from './challenger/actions';
import { challengerReducer, initialize as challengerInitialize } from './challenger/reducer';
import { isResponderAction } from './responder/actions';
import { initialize as responderInitialize, responderReducer } from './responder/reducer';
import { isNonTerminalResponderState } from './responder/states';
import { DisputeState, isTerminal } from './state';

export const initializeResponderState = (
  processId: string,
  channelId: string,
  expiryTime: number,
  sharedData: SharedData,
  challengeCommitment: Commitment,
): ProtocolStateWithSharedData<DisputeState> => {
  return responderInitialize(processId, channelId, expiryTime, sharedData, challengeCommitment);
};

export const initializeChallengerState = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<DisputeState> => {
  const { sharedData: updatedSharedData, state: protocolState } = challengerInitialize(
    processId,
    channelId,
    sharedData,
  );
  return { protocolState, sharedData: updatedSharedData };
};

export const disputeReducer = (
  protocolState: DisputeState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<DisputeState> => {
  if (!isChallengerAction(action) && !isResponderAction(action)) {
    return { protocolState, sharedData };
  }
  if (isTerminal(protocolState)) {
    return { protocolState, sharedData };
  }
  if (isNonTerminalResponderState(protocolState)) {
    return responderReducer(protocolState, sharedData, action);
  } else {
    const { state, sharedData: updatedSharedData } = challengerReducer(
      protocolState,
      sharedData,
      action,
    );
    return { protocolState: state, sharedData: updatedSharedData };
  }
};
