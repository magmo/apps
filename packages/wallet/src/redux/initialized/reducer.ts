import { InitializedState } from './state';

import { WalletAction } from '../actions';
import { combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { channelStateReducer } from '../channelState/reducer';
import { fundingStateReducer } from '../fundingState/reducer';
import { accumulateSideEffects } from '../outbox';

export function initializedReducer(
  state: InitializedState,
  action: WalletAction,
): InitializedState {
  // Apply the "independent" reducer
  const { state: newState, sideEffects } = combinedReducer(state, action);
  // Since the wallet state itself has an outbox state, we need to apply the side effects
  // by hand.
  const updatedState = {
    ...state,
    ...newState,
    outboxState: accumulateSideEffects(state.outboxState, sideEffects),
  };

  // Inspect the global state for interactions
  return coordinator(updatedState, action);
}
const combinedReducer = combineReducersWithSideEffects({
  channelState: channelStateReducer,
  fundingState: fundingStateReducer,
});

export function coordinator(state: InitializedState, action: WalletAction): InitializedState {
  return state;
}
