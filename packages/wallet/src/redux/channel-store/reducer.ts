import * as states from './state';

import { ReducerWithSideEffects } from '../../utils/reducer-utils';
import { StateWithSideEffects } from '../utils';
import { WalletAction } from '../actions';

export const channelStateReducer: ReducerWithSideEffects<states.ChannelStore> = (
  state: states.ChannelStore,
  action: WalletAction,
): StateWithSideEffects<states.ChannelStore> => {
  return { state };
};
