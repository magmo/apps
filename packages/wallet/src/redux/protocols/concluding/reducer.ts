import { ProtocolStateWithSharedData } from '..';
import { SignedCommitment } from '../../../domain';
import { ProtocolAction } from '../../actions';
import { SharedData } from '../../state';
import {
  initialize as initializeInstigator,
  instigatorConcludingReducer,
} from './instigator/reducer';
import { InstigatorNonTerminalState, isConcludingInstigatorState } from './instigator/states';
import { initialize as initializeResponder, responderConcludingReducer } from './responder/reducer';
import { ResponderNonTerminalState } from './responder/states';
import { ConcludingState } from './states';

export function concludingReducer(
  protocolState: ResponderNonTerminalState | InstigatorNonTerminalState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ConcludingState> {
  if (isConcludingInstigatorState(protocolState)) {
    const result = instigatorConcludingReducer(protocolState, sharedData, action);
    return { protocolState: result.protocolState, sharedData: result.sharedData };
  } else {
    const result = responderConcludingReducer(protocolState, sharedData, action);
    return { protocolState: result.protocolState, sharedData: result.sharedData };
  }
}

export function initializeInstigatorState(
  channelId: string,
  processId: string,
  sharedData: SharedData,
) {
  const result = initializeInstigator(channelId, processId, sharedData);
  return { protocolState: result.protocolState, sharedData: result.sharedData };
}

export function initializeResponderState(
  signedCommitment: SignedCommitment,
  processId: string,
  sharedData: SharedData,
) {
  const result = initializeResponder(signedCommitment, processId, sharedData);
  return { protocolState: result.protocolState, sharedData: result.sharedData };
}
