import { InitializedState } from './state';

import { WalletAction } from '../actions';
import { combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { channelStateReducer } from '../channelState/reducer';
import { fundingStateReducer } from '../fundingState/reducer';

export function initializedReducer(
  state: InitializedState,
  action: WalletAction,
): InitializedState {
  const { state: newState, outboxState } = combinedReducer(state, action);
  return { ...state, ...newState, outboxState };
}
const combinedReducer = combineReducersWithSideEffects({
  channelState: channelStateReducer,
  fundingState: fundingStateReducer,
});
