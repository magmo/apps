import {
  WalletState,
  INITIALIZING,
  OPENING,
  FUNDING,
  RUNNING,
  CHALLENGING,
  RESPONDING,
  WITHDRAWING,
  CLOSING,
  waitForLogin,
  approveConclude,
  ApproveConclude,
  acknowledgeConclude,
  AcknowledgeConclude,
} from '../../states';

import { initializingReducer } from './initializing';
import { openingReducer } from './opening';
import { fundingReducer } from './funding';
import { runningReducer } from './running';
import { challengingReducer } from './challenging';
import { respondingReducer } from './responding';
import { withdrawingReducer } from './withdrawing';
import { closingReducer } from './closing';
import { WalletAction, CONCLUDE_REQUESTED, MESSAGE_RECEIVED, MESSAGE_SENT, TRANSACTION_SENT_TO_METAMASK, DISPLAY_MESSAGE_SENT } from '../actions';
import { unreachable, ourTurn, validTransition } from '../../utils/reducer-utils';
import { validCommitmentSignature } from '../../utils/signing-utils';
import { showWallet } from 'magmo-wallet-client/lib/wallet-events';
import { StateType, fromHex } from 'fmg-core/lib/state';

const initialState = waitForLogin();

export const walletReducer = (state: WalletState = initialState, action: WalletAction): WalletState => {

  if (action.type === MESSAGE_SENT) {
    state = { ...state, messageOutbox: undefined };
  }
  if (action.type === DISPLAY_MESSAGE_SENT) {
    state = { ...state, displayOutbox: undefined };
  }

  if (action.type === TRANSACTION_SENT_TO_METAMASK) {
    state = { ...state, transactionOutbox: undefined };
  }

  const conclusionStateFromOwnRequest = receivedValidOwnConclusionRequest(state, action);
  if (conclusionStateFromOwnRequest) { return conclusionStateFromOwnRequest; }

  const conclusionStateFromOpponentRequest = receivedValidOpponentConclusionRequest(state, action);
  if (conclusionStateFromOpponentRequest) { return conclusionStateFromOpponentRequest; }

  switch (state.stage) {
    case INITIALIZING:
      return initializingReducer(state, action);
    case OPENING:
      return openingReducer(state, action);
    case FUNDING:
      return fundingReducer(state, action);
    case RUNNING:
      return runningReducer(state, action);
    case CHALLENGING:
      return challengingReducer(state, action);
    case RESPONDING:
      return respondingReducer(state, action);
    case WITHDRAWING:
      return withdrawingReducer(state, action);
    case CLOSING:
      return closingReducer(state, action);
    default:
      return unreachable(state);
  }
  return state;
};

const receivedValidOwnConclusionRequest = (state: WalletState, action: WalletAction): ApproveConclude | null => {
  if (state.stage !== FUNDING && state.stage !== RUNNING) { return null; }
  if (action.type !== CONCLUDE_REQUESTED || !ourTurn(state)) { return null; }
  return approveConclude({ ...state, displayOutbox: showWallet() });
};

const receivedValidOpponentConclusionRequest = (state: WalletState, action: WalletAction): AcknowledgeConclude | null => {
  if (state.stage !== FUNDING && state.stage !== RUNNING) { return null; }
  if (action.type !== MESSAGE_RECEIVED) { return null; }

  let messageState;
  try {
    messageState = fromHex(action.data);
  } catch (error) {
    return null;
  }

  if (messageState.stateType !== StateType.Conclude) {
    return null;
  }
  // check signature
  const opponentAddress = state.participants[1 - state.ourIndex];
  if (!action.signature) { return null; }
  if (!validCommitmentSignature(messageState, action.signature, opponentAddress)) { return null; }
  if (!validTransition(state, messageState)) { return null; }

  return acknowledgeConclude({
    ...state,
    turnNum: messageState.turnNum,
    lastState: { state: messageState, signature: action.signature },
    penultimateState: state.lastCommitment,
    displayOutbox: showWallet(),
  });
};

