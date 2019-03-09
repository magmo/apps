import {
  OPENING,
  FUNDING,
  RUNNING,
  CHALLENGING,
  RESPONDING,
  WITHDRAWING,
  CLOSING,
  approveConclude,
  ApproveConclude,
  acknowledgeConclude,
  AcknowledgeConclude,
  ChannelState,
} from '../states/channels';
import { WalletState, INITIALIZING, waitForLogin, WALLET_INITIALIZED } from '../states';

import { initializingReducer } from './initializing';
import { openingReducer } from './channels/opening';
import { fundingReducer } from './channels/funding';
import { runningReducer } from './channels/running';
import { challengingReducer } from './channels/challenging';
import { respondingReducer } from './channels/responding';
import { withdrawingReducer } from './channels/withdrawing';
import { closingReducer } from './channels/closing';
import {
  WalletAction,
  CONCLUDE_REQUESTED,
  MESSAGE_SENT,
  TRANSACTION_SENT_TO_METAMASK,
  DISPLAY_MESSAGE_SENT,
  COMMITMENT_RECEIVED,
} from '../actions';
import { unreachable, ourTurn, validTransition } from '../../utils/reducer-utils';
import { validCommitmentSignature } from '../../utils/signing-utils';
import { showWallet } from 'magmo-wallet-client/lib/wallet-events';
import { CommitmentType } from 'fmg-core';
import { OutboxState } from '../states/shared';
import { initializedReducer } from './initialized';

const initialState = waitForLogin();

export const walletReducer = (
  state: WalletState = initialState,
  action: WalletAction,
): WalletState => {
  const nextOutbox: OutboxState = {};
  if (action.type === MESSAGE_SENT) {
    nextOutbox.messageOutbox = undefined;
  }
  if (action.type === DISPLAY_MESSAGE_SENT) {
    nextOutbox.displayOutbox = undefined;
  }
  if (action.type === TRANSACTION_SENT_TO_METAMASK) {
    nextOutbox.transactionOutbox = undefined;
  }
  state = {
    ...state,
    outboxState: outboxReducer(state.outboxState, { messageOutbox: undefined }),
  };

  if (state.stage === WALLET_INITIALIZED) {
    const conclusionStateFromOwnRequest = receivedValidOwnConclusionRequest(
      state.channelState,
      action,
    );
    if (conclusionStateFromOwnRequest) {
      return { ...state, channelState: conclusionStateFromOwnRequest };
    }
  }

  const conclusionStateFromOpponentRequest = receivedValidOpponentConclusionRequest(state, action);
  if (conclusionStateFromOpponentRequest) {
    return { ...state, channelState: conclusionStateFromOpponentRequest };
  }

  switch (state.stage) {
    case INITIALIZING:
      return initializingReducer(state, action);
    case WALLET_INITIALIZED:
      return initializedReducer(state, action);
    // case OPENING:
    //   return openingReducer(state.channelState, action);
    // case FUNDING:
    //   return fundingReducer(state, action);
    // case RUNNING:
    //   return runningReducer(state, action);
    // case CHALLENGING:
    //   return challengingReducer(state, action);
    // case RESPONDING:
    //   return respondingReducer(state, action);
    // case WITHDRAWING:
    //   return withdrawingReducer(state, action);
    // case CLOSING:
    //   return closingReducer(state, action);
    default:
      return unreachable(state);
  }
};

const receivedValidOwnConclusionRequest = (
  state: InitializingChannelState | ChannelState,
  action: WalletAction,
): ApproveConclude | null => {
  if (state.stage !== FUNDING && state.stage !== RUNNING) {
    return null;
  }
  if (action.type !== CONCLUDE_REQUESTED || !ourTurn(state)) {
    return null;
  }
  return approveConclude({ ...state, displayOutbox: showWallet() });
};

const receivedValidOpponentConclusionRequest = (
  state: WalletState,
  action: WalletAction,
): AcknowledgeConclude | null => {
  if (state.stage !== FUNDING && state.stage !== RUNNING) {
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

  return acknowledgeConclude({
    ...state,
    turnNum: commitment.turnNum,
    lastCommitment: { commitment, signature },
    penultimateCommitment: state.lastCommitment,
    displayOutbox: showWallet(),
  });
};
