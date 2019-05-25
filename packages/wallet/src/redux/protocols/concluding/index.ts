export { Concluding } from './container';
export {
  initializeResponderState,
  initializeInstigatorState,
  concludingReducer as reducer,
} from './reducer';

import { ConcludingActionInstigator } from './instigator/actions';
import { ConcludingActionResponder } from './responder/actions';

export type ConcludingAction = ConcludingActionInstigator | ConcludingActionResponder;
