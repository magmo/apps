export { Concluding } from './container';
export {
  initializeResponderState,
  initializeInstigatorState,
  concludingReducer as reducer,
} from './reducer';

import { ConcludingInstigatorAction } from './instigator/actions';
import { ConcludingResponderAction } from './responder/actions';

export type ConcludingAction = ConcludingInstigatorAction | ConcludingResponderAction;
