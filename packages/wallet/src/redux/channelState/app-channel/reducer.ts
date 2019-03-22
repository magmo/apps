import * as states from './state';

import { openingReducer } from './opening/reducer';
import { fundingReducer } from './funding/reducer';
import { runningReducer } from './running/reducer';
import { challengingReducer } from './challenging/reducer';
import { respondingReducer } from './responding/reducer';
import { withdrawingReducer } from './withdrawing/reducer';
import { closingReducer } from './closing/reducer';

import { showWallet } from 'magmo-wallet-client/lib/wallet-events';
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
} from '../../actions';
import { StateWithSideEffects } from '../../shared/state';
import { validCommitmentSignature } from '../../../utils/signing-utils';

export const initializedAppChannelStatusReducer: ReducerWithSideEffects<states.AppChannelStatus> = (
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
