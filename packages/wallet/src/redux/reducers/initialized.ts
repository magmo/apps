import {
  initializingChannel,
  InitializedState,
  WALLET_INITIALIZED,
  INITIALIZING_CHANNEL,
  WAITING_FOR_CHANNEL_INITIALIZATION,
  channelInitialized,
} from '../states';

import { WalletAction, CHANNEL_INITIALIZED } from '../actions';
import { channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { ethers } from 'ethers';
import { channelReducer } from './channels';
import { unreachable } from '../../utils/reducer-utils';
import { OutboxState } from '../states/shared';

export const initializedReducer = (
  state: InitializedState,
  action: WalletAction,
): InitializedState => {
  if (state.stage !== WALLET_INITIALIZED) {
    return state;
  }

  switch (state.type) {
    case WAITING_FOR_CHANNEL_INITIALIZATION:
      if (action.type === CHANNEL_INITIALIZED) {
        const wallet = ethers.Wallet.createRandom();
        const { address, privateKey } = wallet;

        return initializingChannel({
          ...state,
          outboxState: { messageOutbox: channelInitializationSuccess(wallet.address) },
          channelState: { address, privateKey },
        });
      }
      break;
    case INITIALIZING_CHANNEL:
    case CHANNEL_INITIALIZED:
      const { channelState, outboxState: sideEffects } = channelReducer(state.channelState, action);
      state = sideEffectsReducer(state, sideEffects);
      return channelInitialized({
        ...state,
        channelState,
      });
    default:
      return unreachable(state);
  }

  return state;
};

function sideEffectsReducer(
  state: InitializedState,
  sideEffects: OutboxState | undefined,
): InitializedState {
  // TODO: What about unhandled actions?

  if (!sideEffects) {
    return state;
  }
  // TODO: We need to think about whether to overwrite existing outbox items.
  const newState = { ...state, outboxState: { ...state.outboxState } };
  Object.keys(sideEffects).map(k => (newState.outboxState[k] = sideEffects[k]));

  return newState;
}
