import { InitializedState } from './state';

import { WalletAction } from '../actions';
import { combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { channelReducer } from '../channelState/reducer';
import { fundingStateReducer } from '../fundingState/reducer';

export const initializedReducer: (
  state: InitializedState,
  action: WalletAction,
) => InitializedState = combineReducersWithSideEffects({
  channelState: channelReducer,
  fundingState: fundingStateReducer,
});
