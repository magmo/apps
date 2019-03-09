import { initializingChannel, InitializedState } from '../states';

import { WalletAction, CHANNEL_INITIALIZED } from '../actions';
import { channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { ethers } from 'ethers';

export const initializedReducer = (
  state: InitializedState,
  action: WalletAction,
): InitializedState => {
  if (action.type === CHANNEL_INITIALIZED) {
    const wallet = ethers.Wallet.createRandom();
    const { address, privateKey } = wallet;

    return initializingChannel({
      ...state,
      outboxState: { messageOutbox: channelInitializationSuccess(wallet.address) },
      channelState: { address, privateKey },
    });
  }

  // TODO: call the channel reducer
  return state;
};
