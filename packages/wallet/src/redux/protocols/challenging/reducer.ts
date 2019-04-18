import { ChallengingAction } from './actions';
import {
  ChallengingState as CState,
  TerminalState as TerminalCState,
  NonTerminalState as NonTerminalCState,
  waitForApproval,
  waitForResponseOrTimeout,
  acknowledgeFailure,
  acknowledgeUnnecessary,
} from './states';
import { unreachable, ourTurn } from '../../../utils/reducer-utils';
import { SharedData } from '..';
import * as actions from './actions';
import { TransactionAction } from '../transaction-submission/actions';
import { isTransactionAction } from '../../actions';
import { transactionReducer } from '../transaction-submission';
import { isSuccess, isFailure } from '../transaction-submission/states';
import { getChannel } from 'src/redux/state';
import { createForceMoveTransaction } from 'src/utils/transaction-generator';

type Storage = SharedData;

export interface ReturnVal {
  state: CState;
  storage: Storage;
}

export function challengingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ChallengingAction | TransactionAction,
): ReturnVal {
  if (isTransactionAction(action)) {
    return handleTransactionAction(state, storage, action);
  }

  switch (action.type) {
    case actions.CHALLENGE_APPROVED:
      return challengeApproved(state, storage);
    case actions.CHALLENGE_DENIED:
      return challengeDenied(state, storage);
    case actions.ACKNOWLEDGED_CHALLENGE_UNNECESSARY:
      return acknowledgedChallengeUnnecessary(state, storage);
    case actions.CHALLENGE_RESPONSE_RECEIVED:
      return challengeResponseRecieved(state, storage);
    case actions.CHALLENGE_TIMED_OUT:
      return challengeTimedOut(state, storage);
    case actions.CHALLENGE_TIMEOUT_ACKNOWLEDGED:
      return challengeTimeoutAcknowledged(state, storage);
    case actions.CHALLENGE_RESPONSE_ACKNOWLEDGED:
      return challengeResponseAcknowledged(state, storage);
    case actions.CHALLENGE_FAILURE_ACKNOWLEDGED:
      return challengeFailureAcknowledged(state, storage);
    default:
      return unreachable(action);
  }
}

export function initialize(channelId: string, processId: string, storage: Storage): ReturnVal {
  return { state: waitForApproval({ channelId, processId }), storage };
}

function handleTransactionAction(
  state: NonTerminalCState,
  storage: Storage,
  action: TransactionAction,
): ReturnVal {
  if (state.type !== 'WaitForTransaction') {
    return { state, storage };
  }
  const transactionSubmission = state.transactionSubmission;

  const retVal = transactionReducer(transactionSubmission, storage, action);
  const transactionState = retVal.state;

  if (isSuccess(transactionState)) {
    state = waitForResponseOrTimeout(state);
  } else if (isFailure(transactionState)) {
    state = acknowledgeFailure(state);
  } else {
    // update the transaction state
    state = { ...state, transactionSubmission: transactionState };
  }

  return { state, storage: retVal.storage };
}

function challengeApproved(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'WaitForApproval') {
    return { state, storage };
  }
  // check the storage to see if it's our turn or not
  const channelState = getChannel(storage, state.channelId);

  if (ourTurn(channelState)) {
    // if it's our turn we don't need to challenge
    return { state: acknowledgeUnnecessary(state), storage };

    // else if we don't have the last two states
  } else {
    // make challenge transaction
    const {
      commitment: fromPosition,
      signature: fromSignature,
    } = channelState.penultimateCommitment;
    const { commitment: toPosition, signature: toSignature } = channelState.lastCommitment;
    const transactionRequest = createForceMoveTransaction(
      fromPosition,
      toPosition,
      fromSignature,
      toSignature,
    );
    // initialize transaction state machine

    // transition to wait for trnasaction
  }
}

function challengeDenied(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function acknowledgedChallengeUnnecessary(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function challengeResponseRecieved(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function challengeTimedOut(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function challengeTimeoutAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function challengeResponseAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}

function challengeFailureAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  return { state, storage };
}
