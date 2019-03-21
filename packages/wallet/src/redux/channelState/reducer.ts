import * as states from './state';

import { openingReducer } from './opening/reducer';
import { fundingReducer } from './funding/reducer';
import { runningReducer } from './running/reducer';
import { challengingReducer } from './challenging/reducer';
import { respondingReducer } from './responding/reducer';
import { withdrawingReducer } from './withdrawing/reducer';
import { closingReducer } from './closing/reducer';
import {
  WalletAction,
  CONCLUDE_REQUESTED,
  COMMITMENT_RECEIVED,
  CHANNEL_INITIALIZED,
  ChannelAction,
  isReceiveFirstCommitment,
} from '../actions';
import {
  unreachable,
  ourTurn,
  validTransition,
  ReducerWithSideEffects,
  combineReducersWithSideEffects,
} from '../../utils/reducer-utils';
import { validCommitmentSignature } from '../../utils/signing-utils';
import { showWallet, channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { CommitmentType } from 'fmg-core';
import { StateWithSideEffects } from '../shared/state';
import { ethers } from 'ethers';
import { channelID } from 'fmg-core/lib/channel';

export const channelStateReducer: ReducerWithSideEffects<states.ChannelState> = (
  state: states.ChannelState,
  action: WalletAction,
): StateWithSideEffects<states.ChannelState> => {
  if (isReceiveFirstCommitment(action)) {
    // We manually select and move the initializing channel into the initializedChannelState
    // before applying the combined reducer, so that the address and private key is in the
    // right slot (by its channelId)
    const channel = action.commitment.channel;
    const channelId = channelID(channel);
    if (state.initializedChannels[channelId]) {
      throw new Error('Channel already exists');
    }
    const initializingAddresses = new Set(Object.keys(state.initializingChannels));
    const ourAddress = channel.participants.find(addr => initializingAddresses.has(addr));
    if (!ourAddress) {
      return { state };
    }
    const ourIndex = channel.participants.indexOf(ourAddress);

    const { address, privateKey } = state.initializingChannels[ourAddress];
    delete state.initializingChannels[ourAddress];
    state.initializedChannels[channelId] = states.waitForChannel({ address, privateKey, ourIndex });
    state.activeAppChannelId = channelId;
  }

  return combinedReducer(state, action, {
    initializedChannels: { appChannelId: state.activeAppChannelId },
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
  return {
    state: {
      ...state,
      // We have to temporarily store the private key under the address, since
      // we can't know the channel id until both participants know their addresses.
      [address]: states.waitForChannel({ address, privateKey }),
    },
    outboxState: { messageOutbox: channelInitializationSuccess(wallet.address) },
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

  const { state: newState, outboxState } = initializedChannelStatusReducer(existingChannel, action);

  return { state: { ...state, [appChannelId]: newState }, outboxState };
};

const initializedChannelStatusReducer: ReducerWithSideEffects<states.ChannelStatus> = (
  state: states.ChannelStatus,
  action: ChannelAction,
): StateWithSideEffects<states.ChannelStatus> => {
  const conclusionStateFromOwnRequest = receivedValidOwnConclusionRequest(state, action);
  if (conclusionStateFromOwnRequest) {
    return {
      state: conclusionStateFromOwnRequest,
      outboxState: { displayOutbox: showWallet() },
    };
  }

  const conclusionStateFromOpponentRequest = receivedValidOpponentConclusionRequest(state, action);
  if (conclusionStateFromOpponentRequest) {
    return {
      state: conclusionStateFromOpponentRequest,
      outboxState: { displayOutbox: showWallet() },
    };
  }

  switch (state.stage) {
    case states.OPENING:
      return openingReducer(state, action);
    case states.FUNDING:
      return fundingReducer(state, action);
    case states.RUNNING:
      return runningReducer(state, action);
    case states.CHALLENGING:
      return challengingReducer(state, action);
    case states.RESPONDING:
      return respondingReducer(state, action);
    case states.WITHDRAWING:
      return withdrawingReducer(state, action);
    case states.CLOSING:
      return closingReducer(state, action);
    default:
      return unreachable(state);
  }
};

const combinedReducer = combineReducersWithSideEffects({
  initializingChannels,
  initializedChannels,
});

const receivedValidOwnConclusionRequest = (
  state: states.ChannelStatus,
  action: WalletAction,
): states.ApproveConclude | null => {
  if (state.stage !== states.FUNDING && state.stage !== states.RUNNING) {
    return null;
  }
  if (action.type !== CONCLUDE_REQUESTED || !ourTurn(state)) {
    return null;
  }
  return states.approveConclude({ ...state });
};

const receivedValidOpponentConclusionRequest = (
  state: states.ChannelStatus,
  action: WalletAction,
): states.AcknowledgeConclude | null => {
  if (state.stage !== states.FUNDING && state.stage !== states.RUNNING) {
    return null;
  }
  if (action.type !== COMMITMENT_RECEIVED) {
    return null;
  }

  const { commitment, signature } = action;

  if (commitment.commitmentType !== CommitmentType.Conclude) {
    return null;
  }
  // check signature
  const opponentAddress = state.participants[1 - state.ourIndex];
  if (!validCommitmentSignature(commitment, signature, opponentAddress)) {
    return null;
  }
  if (!validTransition(state, commitment)) {
    return null;
  }

  return states.acknowledgeConclude({
    ...state,
    turnNum: commitment.turnNum,
    lastCommitment: { commitment, signature },
    penultimateCommitment: state.lastCommitment,
  });
};
