import * as states from './state';

import {
  WalletAction,
  CHANNEL_INITIALIZED,
  ChannelAction,
  isReceiveFirstCommitment,
} from '../actions';
import { ReducerWithSideEffects, combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { StateWithSideEffects } from '../shared/state';
import { ethers } from 'ethers';
import { channelID } from 'fmg-core/lib/channel';
import { initializedAppChannelStatusReducer } from './app-channel/reducer';
import { waitForChannel } from './app-channel/state';

export const channelStateReducer: ReducerWithSideEffects<states.ChannelState> = (
  state: states.ChannelState,
  action: WalletAction,
): StateWithSideEffects<states.ChannelState> => {
  const newState = { ...state };
  if (isReceiveFirstCommitment(action)) {
    // We manually select and move the initializing channel into the initializedChannelState
    // before applying the combined reducer, so that the address and private key is in the
    // right slot (by its channelId)
    const channel = action.commitment.channel;
    const channelId = channelID(channel);
    if (newState.initializedChannels[channelId]) {
      throw new Error('Channel already exists');
    }
    const initializingAddresses = new Set(Object.keys(newState.initializingChannels));
    const ourAddress = channel.participants.find(addr => initializingAddresses.has(addr));
    if (!ourAddress) {
      return { state: newState };
    }
    const ourIndex = channel.participants.indexOf(ourAddress);

    const { address, privateKey } = newState.initializingChannels[ourAddress];
    delete newState.initializingChannels[ourAddress];
    // TODO: Needs to handle both app and ledger
    newState.initializedChannels[channelId] = waitForChannel({
      address,
      privateKey,
      ourIndex,
    });

    // Since the wallet only manages one channel at a time, when it receives the first
    // prefundsetup commitment for a channel, from the application, we set the
    // activeAppChannelId accordingly.
    // In the future, the application might need to specify the intended channel id
    // for the action
    newState.activeAppChannelId = channelId;
  }

  return combinedReducer(newState, action, {
    initializedChannels: { appChannelId: newState.activeAppChannelId },
  });
};

const initializingChannels: ReducerWithSideEffects<states.InitializingChannelState> = (
  state: states.InitializingChannelState,
  action: ChannelAction,
): StateWithSideEffects<states.InitializingChannelState> => {
  if (action.type !== CHANNEL_INITIALIZED) {
    return { state };
  }
  const wallet = ethers.Wallet.createRandom();
  const { address, privateKey } = wallet;
  // TODO: Needs to handle both app and ledger channels
  return {
    state: {
      ...state,
      // We have to temporarily store the private key under the address, since
      // we can't know the channel id until both participants know their addresses.
      [address]: waitForChannel({ address, privateKey }),
    },
    sideEffects: { messageOutbox: channelInitializationSuccess(wallet.address) },
  };
};

const initializedChannels: ReducerWithSideEffects<states.InitializedChannelState> = (
  state: states.InitializedChannelState,
  action: ChannelAction,
  data: { appChannelId: string },
): StateWithSideEffects<states.InitializedChannelState> => {
  if (action.type === CHANNEL_INITIALIZED) {
    return { state };
  }
  const { appChannelId } = data;

  const existingChannel = state[appChannelId];
  if (!existingChannel) {
    // TODO:  This channel should really exist -- should we throw?
    return { state };
  }
  if (existingChannel.channelType === 'Application') {
    const { state: newState, outboxState } = initializedAppChannelStatusReducer(
      existingChannel,
      action,
    );

    return { state: { ...state, [appChannelId]: newState }, outboxState };
  } else {
    // TODO: Handle ledger channels
    return { state, outboxState: {} };
  }
};

const combinedReducer = combineReducersWithSideEffects({
  initializingChannels,
  initializedChannels,
});
