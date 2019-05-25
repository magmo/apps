export { Concluding } from './container';
export {
  initializeResponderState,
  initializeInstigatorState,
  concludingReducer as reducer,
} from './reducer';

import { ConcludingInstigatorAction, isConcludingInstigatorAction } from './instigator/actions';
import { ConcludingResponderAction, isConcludingResponderAction } from './responder/actions';
import { ProtocolAction } from '../../../redux/actions';

export type ConcludingAction = ConcludingInstigatorAction | ConcludingResponderAction;

export function isConcludingAction(action: ProtocolAction): action is ConcludingAction {
  return isConcludingInstigatorAction(action) || isConcludingResponderAction(action);
}
