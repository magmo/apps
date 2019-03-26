import * as states from './state';

import {
  WalletAction,
  CHANNEL_INITIALIZED,
  ChannelAction,
  isReceiveFirstCommitment,
  COMMITMENT_RECEIVED,
} from '../actions';
import { ReducerWithSideEffects, combineReducersWithSideEffects } from '../../utils/reducer-utils';
import { StateWithSideEffects } from '../shared/state';
import { channelID } from 'fmg-core/lib/channel';
import { initializingAppChannels, initializedAppChannels } from './app-channel/reducer';
import * as appChannelState from './app-channel/state';
import * as internalActions from '../internal/actions';
import * as ledgerChannelState from './ledger-channel/state';
import { initializingLedgerChannels, initializedLedgerChannels } from './ledger-channel/reducer';
import { Commitment } from 'fmg-core/lib/commitment';

export const channelStateReducer: ReducerWithSideEffects<states.ChannelState> = (
  state: states.ChannelState,
  action: WalletAction | internalActions.InternalAction,
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

    if (getCommitmentChannelType(action.commitment) === 'Ledger') {
      const { appChannelId } = state.initializingChannels[
        ourAddress
      ] as ledgerChannelState.InitializingLedgerChannelStatus;
      // Ledger channel
      newState.initializedChannels[channelId] = ledgerChannelState.waitForInitialPreFundSetup({
        address,
        privateKey,
        ourIndex,
        appChannelId,
      });
    } else {
      // App Channel
      newState.initializedChannels[channelId] = appChannelState.waitForChannel({
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
  }

  return combinedReducer(newState, action, {
    initializedChannels: { appChannelId: newState.activeAppChannelId },
  });
};

const initializingChannels: ReducerWithSideEffects<states.InitializingChannelState> = (
  state: states.InitializingChannelState,
  action: ChannelAction | internalActions.InternalAction,
): StateWithSideEffects<states.InitializingChannelState> => {
  if (action.type === CHANNEL_INITIALIZED) {
    return initializingAppChannels(state, action);
  } else if (action.type === internalActions.OPEN_LEDGER_CHANNEL) {
    return initializingLedgerChannels(state, action);
  }
  return { state };
};

const initializedChannels: ReducerWithSideEffects<states.InitializedChannelState> = (
  state: states.InitializedChannelState,
  action: ChannelAction,
  data: { appChannelId: string },
): StateWithSideEffects<states.InitializedChannelState> => {
  if (isActionForLedgerChannel(action)) {
    return initializedLedgerChannels(state, action, data);
  } else {
    return initializedAppChannels(state, action, data);
  }
};

const isActionForLedgerChannel = (action): boolean => {
  if (action.type === COMMITMENT_RECEIVED) {
    return getCommitmentChannelType(action.commitment) === 'Ledger';
  } else {
    return action.type === internalActions.OPEN_LEDGER_CHANNEL;
  }
};

const getCommitmentChannelType = (commitment: Commitment): 'Ledger' | 'Application' => {
  return commitment.channel.channelType === 'CONSENSUS_LIBRARY' ? 'Ledger' : 'Application';
};

const combinedReducer = combineReducersWithSideEffects({
  initializingChannels,
  initializedChannels,
});
