import {
  ChallengerState as CState,
  NonTerminalChallengerState as NonTerminalCState,
  approveChallenge,
  waitForResponseOrTimeout,
  acknowledgeFailure as acknowledgeFailureState,
  FailureReason,
  waitForTransaction,
  acknowledgeResponse,
  acknowledgeTimeout,
  successOpen,
  failure,
  successClosed,
} from './states';
import { unreachable } from '../../../../utils/reducer-utils';
import { SharedData, registerChannelToMonitor } from '../../../state';
import * as actions from './actions';
import { TransactionAction } from '../../transaction-submission/actions';
import { isTransactionAction, ProtocolAction } from '../../../actions';
import {
  transactionReducer,
  initialize as initializeTransaction,
} from '../../transaction-submission';
import { isSuccess, isFailure } from '../../transaction-submission/states';

import {
  showWallet,
  hideWallet,
  sendChallengeStateReceived,
  sendChallengeComplete,
  sendConcludeSuccess,
  ourTurn,
  isFullyOpen,
} from '../../reducer-helpers';

import { SignedState } from 'nitro-protocol';
import { storeState } from '../../../channel-store/reducer';
import { getChannelState } from '../../../selectors';

const CHALLENGE_TIMEOUT = 5 * 60000;

export interface ReturnVal {
  state: CState;
  sharedData: SharedData;
}

export function challengerReducer(
  state: NonTerminalCState,
  sharedData: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (!actions.isChallengerAction(action)) {
    console.warn(`Challenging reducer received non-challenging action ${action.type}.`);
    return { state, sharedData };
  }
  if (isTransactionAction(action) && state.type === 'Challenging.WaitForTransaction') {
    return handleTransactionAction(state, sharedData, action);
  }
  if (isTransactionAction(action)) {
    console.warn(`Challenging reducer received transaction action in state ${state.type}.`);
    return { state, sharedData };
  }

  switch (action.type) {
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_APPROVED':
      return challengeApproved(state, sharedData);
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_DENIED':
      return challengeDenied(state, sharedData);
    case 'WALLET.ADJUDICATOR.RESPOND_WITH_MOVE_EVENT':
      return challengeResponseReceived(state, sharedData, action.responseState);
    case 'WALLET.ADJUDICATOR.REFUTED_EVENT':
      return refuteReceived(state, sharedData);
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRED':
      return challengeTimedOut(state, sharedData);
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRY_TIME_SET':
      return handleChallengeCreatedEvent(state, sharedData, action.expiryTime);
    case 'WALLET.DISPUTE.CHALLENGER.ACKNOWLEDGED':
      switch (state.type) {
        case 'Challenging.AcknowledgeResponse':
          return challengeResponseAcknowledged(state, sharedData);
        case 'Challenging.AcknowledgeFailure':
          return challengeFailureAcknowledged(state, sharedData);
        case 'Challenging.AcknowledgeTimeout':
          return timeoutAcknowledged(state, sharedData);
        default:
          return { state, sharedData };
      }
    case 'WALLET.DISPUTE.CHALLENGER.EXIT_CHALLENGE':
      return {
        state: successClosed({}),
        sharedData,
      };
    default:
      return unreachable(action);
  }
}

export function initialize(
  channelId: string,
  processId: string,
  sharedData: SharedData,
): ReturnVal {
  const channelState = getChannelState(sharedData, channelId);
  const props = { processId, channelId };

  if (!channelState) {
    return {
      state: acknowledgeFailure(props, 'ChannelDoesntExist'),
      sharedData: showWallet(sharedData),
    };
  }

  if (!isFullyOpen()) {
    return { state: acknowledgeFailure(props, 'NotFullyOpen'), sharedData: showWallet(sharedData) };
  }

  if (ourTurn(sharedData, channelId)) {
    // if it's our turn we don't need to challenge
    return {
      state: acknowledgeFailure(props, 'AlreadyHaveLatest'),
      sharedData: showWallet(sharedData),
    };
  }
  sharedData = registerChannelToMonitor(
    sharedData,
    processId,
    channelId,
    [], // TODO: Be passed a proper protocolLocator
  );
  return { state: approveChallenge({ channelId, processId }), sharedData: showWallet(sharedData) };
}

function handleChallengeCreatedEvent(
  state: NonTerminalCState,
  sharedData: SharedData,
  expiryTime: number,
): ReturnVal {
  if (
    state.type !== 'Challenging.WaitForResponseOrTimeout' &&
    state.type !== 'Challenging.WaitForTransaction'
  ) {
    return { state, sharedData };
  } else {
    const updatedState = { ...state, expiryTime };
    return { state: updatedState, sharedData };
  }
}

function handleTransactionAction(
  state: NonTerminalCState,
  sharedData: SharedData,
  action: TransactionAction,
): ReturnVal {
  if (state.type !== 'Challenging.WaitForTransaction') {
    return { state, sharedData };
  }
  const transactionSubmission = state.transactionSubmission;

  const retVal = transactionReducer(transactionSubmission, sharedData, action);
  const transactionState = retVal.state;

  if (isSuccess(transactionState)) {
    // We use an estimate if we haven't received a real expiry time yet.
    const expiryTime = state.expiryTime || new Date(Date.now() + CHALLENGE_TIMEOUT).getTime();
    state = waitForResponseOrTimeout({ ...state, expiryTime });
  } else if (isFailure(transactionState)) {
    state = acknowledgeFailure(state, 'TransactionFailed');
  } else {
    // update the transaction state
    state = { ...state, transactionSubmission: transactionState };
  }

  return { state, sharedData: retVal.storage };
}

function challengeApproved(state: NonTerminalCState, sharedData: SharedData): ReturnVal {
  if (state.type !== 'Challenging.ApproveChallenge') {
    return { state, sharedData };
  }
  const channelState = getChannelState(sharedData, state.channelId);

  // These shouldn't have changed but the type system doesn't know that. In any case, we
  // might as well be safe. And type-safe...
  if (!channelState) {
    return { state: acknowledgeFailure(state, 'ChannelDoesntExist'), sharedData };
  }
  if (!isFullyOpen()) {
    return { state: acknowledgeFailure(state, 'NotFullyOpen'), sharedData };
  }

  if (ourTurn(sharedData, state.channelId)) {
    // if it's our turn now, a commitment must have arrived while we were approving
    return { state: acknowledgeFailure(state, 'LatestWhileApproving'), sharedData };
  }

  // else if we don't have the last two states
  // make challenge transaction
  const transactionRequest = {};
  // TODO: Implement this with latest nitro protocol
  // const [penultimateCommitment, lastCommitment] = channelState.signedStates;
  // const { commitment: fromPosition, signature: fromSignature } = penultimateCommitment;
  // const { commitment: toPosition, signature: toSignature } = lastCommitment;
  // const transactionRequest = createForceMoveTransaction(
  //   fromPosition,
  //   toPosition,
  //   fromSignature,
  //   toSignature,
  // );
  // initialize transaction state machine
  const returnVal = initializeTransaction(
    transactionRequest,
    state.processId,
    state.channelId,
    sharedData,
  );
  const transactionSubmission = returnVal.state;

  // transition to wait for transaction
  const newState = waitForTransaction({ ...state, transactionSubmission });
  return { state: newState, sharedData: returnVal.storage };
}

function challengeDenied(state: NonTerminalCState, sharedData: SharedData): ReturnVal {
  if (state.type !== 'Challenging.ApproveChallenge') {
    return { state, sharedData };
  }

  state = acknowledgeFailure(state, 'DeclinedByUser');
  return { state, sharedData };
}

function refuteReceived(state: NonTerminalCState, sharedData: SharedData): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, sharedData };
  }

  state = acknowledgeResponse(state);
  return { state, sharedData };
}

function challengeResponseReceived(
  state: NonTerminalCState,
  sharedData: SharedData,
  challengeState: SignedState,
): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, sharedData };
  }

  state = acknowledgeResponse(state);
  sharedData = sendChallengeStateReceived(sharedData, challengeState);

  sharedData = storeState(challengeState, sharedData);
  return { state, sharedData };
}

function challengeTimedOut(state: NonTerminalCState, sharedData: SharedData): ReturnVal {
  if (state.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { state, sharedData };
  }

  state = acknowledgeTimeout(state);

  return { state, sharedData: sendConcludeSuccess(sharedData) };
  // From the point of view of the app, it is as if we have concluded
}

function challengeResponseAcknowledged(
  state: NonTerminalCState,
  sharedData: SharedData,
): ReturnVal {
  if (state.type !== 'Challenging.AcknowledgeResponse') {
    return { state, sharedData };
  }
  sharedData = sendChallengeComplete(hideWallet(sharedData));
  return { state: successOpen({}), sharedData };
}

function challengeFailureAcknowledged(state: NonTerminalCState, sharedData: SharedData): ReturnVal {
  if (state.type !== 'Challenging.AcknowledgeFailure') {
    return { state, sharedData };
  }

  return { state: failure(state), sharedData: hideWallet(sharedData) };
}

function timeoutAcknowledged(state: NonTerminalCState, sharedData: SharedData) {
  if (state.type !== 'Challenging.AcknowledgeTimeout') {
    return { state, sharedData };
  }
  return {
    state: successClosed({}),
    sharedData: hideWallet(sharedData),
  };
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
