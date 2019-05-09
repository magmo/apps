import { ResponderNonTerminalState } from './responder/states';
import { InstigatorNonTerminalState, isConcludingInstigatorState } from './instigator/states';
import { SharedData } from '../../state';
import { ProtocolAction } from '../../actions';
import { ConcludingState } from './state';
import { instigatorConcludingReducer } from './instigator/reducer';
import { responderConcludingReducer } from './responder/reducer';
import { ProtocolStateWithSharedData } from '..';

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
