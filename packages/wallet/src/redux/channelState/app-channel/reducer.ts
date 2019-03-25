import * as states from './state';

import { openingReducer } from './opening/reducer';
import { fundingReducer } from './funding/reducer';
import { runningReducer } from './running/reducer';
import { challengingReducer } from './challenging/reducer';
import { respondingReducer } from './responding/reducer';
import { withdrawingReducer } from './withdrawing/reducer';
import { closingReducer } from './closing/reducer';

import { showWallet, channelInitializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { CommitmentType } from 'fmg-core';
import {
  ReducerWithSideEffects,
  unreachable,
  ourTurn,
  validTransition,
} from '../../../utils/reducer-utils';
import {
  WalletAction,
  ChannelAction,
  CONCLUDE_REQUESTED,
  COMMITMENT_RECEIVED,
  CHANNEL_INITIALIZED,
} from '../../actions';
import { StateWithSideEffects } from '../../shared/state';
import { validCommitmentSignature } from '../../../utils/signing-utils';
import { ethers } from 'ethers';
import { InitializingChannelState, InitializedChannelState } from '../state';
import { InternalAction } from '../../internal/actions';

export const initializingAppChannels: ReducerWithSideEffects<InitializingChannelState> = (
  state: InitializingChannelState,
  action: ChannelAction | InternalAction,
): StateWithSideEffects<InitializingChannelState> => {
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
      [address]: states.waitForChannel({ address, privateKey }),
    },
    outboxState: { messageOutbox: channelInitializationSuccess(wallet.address) },
  };
};

export const initializedAppChannels: ReducerWithSideEffects<InitializedChannelState> = (
  state: InitializedChannelState,
  action: ChannelAction,
  data: { appChannelId: string },
): StateWithSideEffects<InitializedChannelState> => {
  if (action.type === CHANNEL_INITIALIZED) {
    return { state };
  }
  const { appChannelId } = data;

  const existingChannel = state[appChannelId];
  if (!existingChannel) {
    // TODO:  This channel should really exist -- should we throw?
    return { state };
  }

  const { state: newState, outboxState } = initializedAppChannelStatusReducer(
    existingChannel as states.AppChannelStatus,
    action,
  );

  return { state: { ...state, [appChannelId]: newState }, outboxState };
};

const initializedAppChannelStatusReducer: ReducerWithSideEffects<states.AppChannelStatus> = (
  state: states.AppChannelStatus,
  action: ChannelAction,
): StateWithSideEffects<states.AppChannelStatus> => {
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

const receivedValidOwnConclusionRequest = (
  state: states.AppChannelStatus,
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
  state: states.AppChannelStatus,
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
