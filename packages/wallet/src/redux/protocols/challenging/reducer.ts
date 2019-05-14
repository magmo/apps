import {
  ChallengingState as CState,
  NonTerminalState as NonTerminalCState,
  approveChallenge,
  waitForResponseOrTimeout,
  acknowledgeFailure as acknowledgeFailureState,
  FailureReason,
  waitForTransaction,
  acknowledgeResponse,
  acknowledgeTimeout,
  successClosed,
  successOpen,
  failure,
} from './states';
import { unreachable } from '../../../utils/reducer-utils';
import { SharedData, registerChannelToMonitor } from '../../state';
import * as actions from './actions';
import { TransactionAction } from '../transaction-submission/actions';
import {
  isTransactionAction,
  ProtocolAction,
  CHALLENGE_EXPIRED_EVENT,
  REFUTED_EVENT,
  RESPOND_WITH_MOVE_EVENT,
} from '../../actions';
import { transactionReducer, initialize as initializeTransaction } from '../transaction-submission';
import { isSuccess, isFailure } from '../transaction-submission/states';
import { getChannel } from '../../state';
import { createForceMoveTransaction } from '../../../utils/transaction-generator';
import { isFullyOpen, ourTurn } from '../../channel-store';
import {
  showWallet,
  hideWallet,
  sendChallengeCommitmentReceived,
  sendChallengeComplete,
} from '../reducer-helpers';
import { Commitment } from '../../../domain';

type Storage = SharedData;

export interface ReturnVal {
  state: CState;
  storage: Storage;
}

export function challengingReducer(
  state: NonTerminalCState,
  storage: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (!actions.isChallengingAction(action)) {
    console.warn(`Challenging reducer received non-challenging action ${action.type}.`);
    return { state, storage };
  }
  if (isTransactionAction(action)) {
    return handleTransactionAction(state, storage, action);
  }

  switch (action.type) {
    case actions.CHALLENGE_APPROVED:
      return challengeApproved(state, storage);
    case actions.CHALLENGE_DENIED:
      return challengeDenied(state, storage);
    case RESPOND_WITH_MOVE_EVENT:
      return challengeResponseReceived(state, storage, action.responseCommitment);
    case REFUTED_EVENT:
      return refuteReceived(state, storage);
    case CHALLENGE_EXPIRED_EVENT:
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
  const channelState = getChannel(storage, channelId);
  const props = { processId, channelId };

  if (!channelState) {
    return { state: acknowledgeFailure(props, 'ChannelDoesntExist'), storage: showWallet(storage) };
  }

  if (!isFullyOpen(channelState)) {
    return { state: acknowledgeFailure(props, 'NotFullyOpen'), storage: showWallet(storage) };
  }

  if (ourTurn(channelState)) {
    // if it's our turn we don't need to challenge
    return { state: acknowledgeFailure(props, 'AlreadyHaveLatest'), storage: showWallet(storage) };
  }
  storage = registerChannelToMonitor(storage, processId, channelId);
  return { state: approveChallenge({ channelId, processId }), storage: showWallet(storage) };
}

function handleTransactionAction(
  state: NonTerminalCState,
  storage: Storage,
  action: TransactionAction,
): ReturnVal {
  if (state.type !== 'Challenging.WaitForTransaction') {
    return { state, storage };
  }
  const transactionSubmission = state.transactionSubmission;

  const retVal = transactionReducer(transactionSubmission, storage, action);
  const transactionState = retVal.state;

  if (isSuccess(transactionState)) {
    state = waitForResponseOrTimeout(state);
  } else if (isFailure(transactionState)) {
    state = acknowledgeFailure(state, 'TransactionFailed');
  } else {
    // update the transaction state
    state = { ...state, transactionSubmission: transactionState };
  }

  return { state, storage: retVal.storage };
}

function challengeApproved(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.ApproveChallenge') {
    return { state, storage };
  }
  const channelState = getChannel(storage, state.channelId);

  // These shouldn't have changed but the type system doesn't know that. In any case, we
  // might as well be safe. And type-safe...
  if (!channelState) {
    return { state: acknowledgeFailure(state, 'ChannelDoesntExist'), storage };
  }
  if (!isFullyOpen(channelState)) {
    return { state: acknowledgeFailure(state, 'NotFullyOpen'), storage };
  }

  if (ourTurn(channelState)) {
    // if it's our turn now, a commitment must have arrived while we were approving
    return { state: acknowledgeFailure(state, 'LatestWhileApproving'), storage };
  }

  // else if we don't have the last two states
  // make challenge transaction
  const { commitment: fromPosition, signature: fromSignature } = channelState.penultimateCommitment;
  const { commitment: toPosition, signature: toSignature } = channelState.lastCommitment;
  const transactionRequest = createForceMoveTransaction(
    fromPosition,
    toPosition,
    fromSignature,
    toSignature,
  );
  // initialize transaction state machine
  const returnVal = initializeTransaction(transactionRequest, state.processId, storage);
  const transactionSubmission = returnVal.state;

  // transition to wait for transaction
  const newState = waitForTransaction({ ...state, transactionSubmission });
  return { state: newState, storage: returnVal.storage };
}

function challengeDenied(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.ApproveChallenge') {
    return { state, storage };
  }

  state = acknowledgeFailure(state, 'DeclinedByUser');
  return { state, storage };
}

function refuteReceived(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, storage };
  }

  state = acknowledgeResponse(state);
  return { state, storage };
}

function challengeResponseReceived(
  state: NonTerminalCState,
  storage: Storage,
  challengeCommitment: Commitment,
): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, storage };
  }

  state = acknowledgeResponse(state);
  storage = sendChallengeCommitmentReceived(storage, challengeCommitment);
  // TODO: We probably need to update the channel state with the latest commitment?
  // Otherwise the next transition will fail since we're missing a commitment.
  // That might be tricky without the signature...
  return { state, storage };
}

function challengeTimedOut(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, storage };
  }

  state = acknowledgeTimeout(state);
  return { state, storage };
}

function challengeTimeoutAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.AcknowledgeTimeout') {
    return { state, storage };
  }
  // TODO: Should we send out a challenge success or failure here to the app?
  return { state: successClosed(), storage: hideWallet(storage) };
}

function challengeResponseAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.AcknowledgeResponse') {
    return { state, storage };
  }
  storage = sendChallengeComplete(hideWallet(storage));
  return { state: successOpen(), storage };
}

function challengeFailureAcknowledged(state: NonTerminalCState, storage: Storage): ReturnVal {
  if (state.type !== 'Challenging.AcknowledgeFailure') {
    return { state, storage };
  }

  return { state: failure(state), storage: hideWallet(storage) };
}

// Helpers

interface ChannelProps {
  processId: string;
  channelId: string;
  [x: string]: any;
}
function acknowledgeFailure(props: ChannelProps, reason: FailureReason): NonTerminalCState {
  return acknowledgeFailureState({ ...props, reason });
}
