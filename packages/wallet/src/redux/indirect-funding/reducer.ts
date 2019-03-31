import { Initialized } from '../state';
import { IndirectFundingAction as Action } from './actions';

export function indirectFundingReducer(state: Initialized, action: Action): Initialized {
  // handle a FundingRequested event
  //   - look up the channel that funding was requested for
  //   - determine if we're player A or player B
  //
  //
  // find the correct indirect funding entry
  // figure out if it's player-a or player-b and delegate
}
