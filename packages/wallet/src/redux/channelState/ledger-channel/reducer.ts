import * as states from './state';

import { ReducerWithSideEffects } from '../../../utils/reducer-utils';
import { ChannelAction } from '../../actions';
import { StateWithSideEffects } from '../../shared/state';
import { InitializingChannelState, InitializedChannelState } from '../state';
import { InternalAction, OPEN_LEDGER_CHANNEL } from '../../internal/actions';
import { FirstCommitmentReceived } from '../shared/state';

export const initializingLedgerChannels: ReducerWithSideEffects<InitializingChannelState> = (
  state: InitializingChannelState,
  action: ChannelAction | InternalAction,
): StateWithSideEffects<InitializingChannelState> => {
  if (action.type === OPEN_LEDGER_CHANNEL) {
    // TODO: Get the existing app channel info and index by our address
    const existingAppChannel: FirstCommitmentReceived =
      state.initializedChannels[action.appChannelId];
    const { address, privateKey, ourIndex } = existingAppChannel;
    // If we are player A we will be responsible for creating the nonce and can fully init the channel
    // so we should never create an initializingChannel for player A
    // Player B has to wait for the first PreFundSetup to get the channelId so we create an initializingChannel
    if (ourIndex !== 1) {
      return { state };
    } else {
      return {
        state: {
          ...state,
          // We have to temporarily store the private key under the address, since
          // we can't know the channel id until both participants know their addresses.
          [address]: states.waitForInitialPreFundSetup({ address, privateKey }),
        },
      };
    }
  } else {
    return { state };
  }
};

export const initializedLedgerChannels: ReducerWithSideEffects<InitializedChannelState> = (
  state: InitializedChannelState,
): StateWithSideEffects<InitializedChannelState> => {
  return { state };
};
