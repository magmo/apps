import { ReducerWithSideEffects } from '../../utils/reducer-utils';
import { ChannelStore } from '.';
import * as channelActions from './actions';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { channelStateReducer } from './channel-state/reducer';
import { StateWithSideEffects } from '../utils';
import { SignedState } from 'nitro-protocol';
import { SharedData, setChannelStore } from '../state';
import { statesReceived } from '../../communication';
import { EMPTY_LOCATOR } from '../protocols';
import { accumulateSideEffects } from '../outbox';

export const channelStoreReducer: ReducerWithSideEffects<ChannelStore> = (
  state: ChannelStore,
  action: channelActions.ChannelAction,
): StateWithSideEffects<ChannelStore> => {
  const { channel } = action.signedStates[0].state;
  const channelId = getChannelId(channel);
  const channelState = state[channelId];
  const { state: newChannelState, sideEffects } = channelStateReducer(channelState, action);
  return { state: { ...state, [channelId]: newChannelState }, sideEffects };
};

export function storeState(signedState: SignedState, sharedData: SharedData): SharedData {
  return storeStates([signedState], sharedData);
}

export function storeStates(signedStates: SignedState[], sharedData: SharedData): SharedData {
  const { channelStore } = sharedData;
  // TODO: Should we just have channel have it's own action?
  const action = statesReceived({ signedStates, protocolLocator: EMPTY_LOCATOR, processId: '' });

  const { state: updatedChannelStore, sideEffects } = channelStoreReducer(channelStore, action);

  sharedData = setChannelStore(sharedData, updatedChannelStore);
  sharedData.outboxState = accumulateSideEffects(sharedData.outboxState, sideEffects);

  return sharedData;
}
