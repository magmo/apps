import { ResponderNonTerminalState } from './responder/states';
import { InstigatorNonTerminalState, isConcludingInstigatorState } from './instigator/states';
import { SharedData } from '../../state';
import { ProtocolAction } from '../../actions';
import { ConcludingState } from './state';
import {
  instigatorConcludingReducer,
  initialize as initializeInstigator,
} from './instigator/reducer';
import { responderConcludingReducer, initialize as initializeResponder } from './responder/reducer';
import { ProtocolStateWithSharedData } from '..';
import { SignedCommitment } from '../../../domain';

export function concludingReducer(
  state: ResponderNonTerminalState | InstigatorNonTerminalState,
  storage: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ConcludingState> {
  if (isConcludingInstigatorState(state)) {
    const result = instigatorConcludingReducer(state, storage, action);
    return { protocolState: result.state, sharedData: result.storage };
  } else {
    const result = responderConcludingReducer(state, storage, action);
    return { protocolState: result.state, sharedData: result.storage };
  }
}

export function initializeInstigatorState(
  channelId: string,
  processId: string,
  sharedData: SharedData,
) {
  const result = initializeInstigator(channelId, processId, sharedData);
  return { protocolState: result.state, sharedData: result.storage };
}

export function initializeResponderState(
  signedCommitment: SignedCommitment,
  processId: string,
  sharedData: SharedData,
) {
  const result = initializeResponder(signedCommitment, processId, sharedData);
  return { protocolState: result.state, sharedData: result.storage };
}
