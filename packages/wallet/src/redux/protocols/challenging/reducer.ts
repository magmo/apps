import { SharedData } from '../../state';
import { Commitment } from '../../../domain';
import { ProtocolStateWithSharedData } from '..';
import { ChallengingState, isTerminal } from './state';
import { initialize as responderInitialize, responderReducer } from './responder/reducer';
import { initialize as challengerInitialize, challengerReducer } from './challenger/reducer';
import { isNonTerminalResponderState } from './responder/state';
import { ResponderAction } from './responder/actions';
import { ChallengerState } from './challenger/states';

export const initializeResponderState = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
  challengeCommitment: Commitment,
): ProtocolStateWithSharedData<ChallengingState> => {
  return responderInitialize(processId, channelId, sharedData, challengeCommitment);
};

export const initializeChallengerState = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengingState> => {
  const { storage, state: protocolState } = challengerInitialize(processId, channelId, sharedData);
  return { protocolState, sharedData: storage };
};

export const reducer = (
  protocolState: ChallengerState,
  sharedData: SharedData,
  action: ResponderAction,
): ProtocolStateWithSharedData<ChallengingState> => {
  if (isTerminal(protocolState)) {
    return { protocolState, sharedData };
  }
  if (isNonTerminalResponderState(protocolState)) {
    return responderReducer(protocolState, sharedData, action);
  } else {
    const { state, storage } = challengerReducer(protocolState, sharedData, action);
    return { protocolState: state, sharedData: storage };
  }
};
