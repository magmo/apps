import { WaitForAddress } from '../states';
import { ChannelState, waitForChannel } from '../states/channels';

import { WalletAction, CHANNEL_INITIALIZED } from '../actions';
import { channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { NextChannelState } from '../states/shared';
import { ethers } from 'ethers';

export const initializingChannelReducer = (
  state: WaitForAddress,
  action: WalletAction,
): NextChannelState<ChannelState> | WaitForAddress => {
  if (action.type !== CHANNEL_INITIALIZED) {
    return state;
  }
  const wallet = ethers.Wallet.createRandom();
  const newState: NextChannelState<ChannelState> = {
    channelState: waitForChannel({
      ...state,
      address: wallet.address,
      privateKey: wallet.privateKey,
    }),
    messageOutbox: channelInitializationSuccess(wallet.address),
  };
  return newState;
};
