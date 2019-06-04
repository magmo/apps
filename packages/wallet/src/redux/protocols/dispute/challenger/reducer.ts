import {
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
  waitForDefund,
  acknowledgeSuccess,
  acknowledgeClosedButNotDefunded,
  WaitForDefund,
  NonTerminalChallengerState,
  ChallengerState,
} from './states';
import { ProtocolStateWithSharedData } from '../..';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
import { unreachable } from '../../../../utils/reducer-utils';
import { SharedData, registerChannelToMonitor, checkAndStore } from '../../../state';
import * as actions from './actions';
import { TransactionAction } from '../../transaction-submission/actions';
import { isTransactionAction, ProtocolAction } from '../../../actions';
import {
  transactionReducer,
  initialize as initializeTransaction,
} from '../../transaction-submission';
import { isSuccess, isFailure } from '../../transaction-submission/states';
import { getChannel } from '../../../state';
import { createForceMoveTransaction } from '../../../../utils/transaction-generator';
import { isFullyOpen, ourTurn } from '../../../channel-store';
import {
  showWallet,
  hideWallet,
  sendChallengeCommitmentReceived,
  sendChallengeComplete,
  sendConcludeSuccess,
  yieldToProcess,
} from '../../reducer-helpers';
import { Commitment, SignedCommitment } from '../../../../domain';
import { isDefundingAction, DefundingAction } from '../../defunding/actions';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../../constants';

const CHALLENGE_TIMEOUT = 5 * 60000;

export function challengerReducer(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<ChallengerState> {
  if (!actions.isChallengerAction(action)) {
    console.warn(`Challenging reducer received non-challenging action ${action.type}.`);
    return { protocolState, sharedData };
  }
  if (
    isTransactionAction(action) &&
    (protocolState.type === 'Challenging.WaitForResponseOrTimeout' ||
      protocolState.type === 'Challenging.WaitForTransaction')
  ) {
    return handleTransactionAction(protocolState, sharedData, action);
  }
  if (isDefundingAction(action)) {
    return handleDefundingAction(protocolState, sharedData, action);
  }

  switch (action.type) {
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_APPROVED':
      return challengeApproved(protocolState, sharedData);
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_DENIED':
      return challengeDenied(protocolState, sharedData);
    case 'WALLET.ADJUDICATOR.RESPOND_WITH_MOVE_EVENT':
      return challengeResponseReceived(
        protocolState,
        sharedData,
        action.responseCommitment,
        action.responseSignature,
      );
    case 'WALLET.ADJUDICATOR.REFUTED_EVENT':
      return refuteReceived(protocolState, sharedData);
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRED':
      return challengeTimedOut(protocolState, sharedData);
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRY_TIME_SET':
      return handleChallengeCreatedEvent(protocolState, sharedData, action.expiryTime);
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_RESPONSE_ACKNOWLEDGED':
      return challengeResponseAcknowledged(protocolState, sharedData);
    case 'WALLET.DISPUTE.CHALLENGER.CHALLENGE_FAILURE_ACKNOWLEDGED':
      return challengeFailureAcknowledged(protocolState, sharedData);
    case 'WALLET.DISPUTE.CHALLENGER.DEFUND_CHOSEN':
      return defundChosen(protocolState, sharedData);
    case 'WALLET.DISPUTE.CHALLENGER.ACKNOWLEDGED':
      return acknowledged(protocolState, sharedData);
    default:
      return unreachable(action);
  }
}

export function initialize(
  channelId: string,
  processId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<NonTerminalChallengerState> {
  const channelState = getChannel(sharedData, channelId);
  const props = { processId, channelId };

  if (!channelState) {
    return {
      protocolState: acknowledgeFailure(props, 'ChannelDoesntExist'),
      sharedData: showWallet(sharedData),
    };
  }

  if (!isFullyOpen(channelState)) {
    return {
      protocolState: acknowledgeFailure(props, 'NotFullyOpen'),
      sharedData: showWallet(sharedData),
    };
  }

  if (ourTurn(channelState)) {
    // if it's our turn we don't need to challenge
    return {
      protocolState: acknowledgeFailure(props, 'AlreadyHaveLatest'),
      sharedData: showWallet(sharedData),
    };
  }
  sharedData = registerChannelToMonitor(sharedData, processId, channelId);
  return {
    protocolState: approveChallenge({ channelId, processId }),
    sharedData: showWallet(sharedData),
  };
}

function handleChallengeCreatedEvent(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  expiryTime: number,
): ProtocolStateWithSharedData<ChallengerState> {
  if (
    protocolState.type !== 'Challenging.WaitForResponseOrTimeout' &&
    protocolState.type !== 'Challenging.WaitForTransaction'
  ) {
    return { protocolState, sharedData };
  } else {
    const updatedState = { ...protocolState, expiryTime };
    return { protocolState: updatedState, sharedData };
  }
}

function handleTransactionAction(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  action: TransactionAction,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.WaitForTransaction') {
    return { protocolState, sharedData };
  }
  const transactionSubmission = protocolState.transactionSubmission;

  const retVal = transactionReducer(transactionSubmission, sharedData, action);
  const transactionState = retVal.state;

  if (isSuccess(transactionState)) {
    // We use an estimate if we haven't received a real expiry time yet.
    const expiryTime =
      protocolState.expiryTime || new Date(Date.now() + CHALLENGE_TIMEOUT).getTime();
    protocolState = waitForResponseOrTimeout({ ...protocolState, expiryTime });
  } else if (isFailure(transactionState)) {
    protocolState = acknowledgeFailure(protocolState, 'TransactionFailed');
  } else {
    // update the transaction state
    protocolState = { ...protocolState, transactionSubmission: transactionState };
  }

  return { protocolState, sharedData: retVal.storage };
}

function handleDefundingAction(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  action: DefundingAction,
): ProtocolStateWithSharedData<ChallengerState> {
  if (
    protocolState.type !== 'Challenging.WaitForDefund' &&
    protocolState.type !== 'Challenging.AcknowledgeTimeout'
  ) {
    return { protocolState, sharedData };
  }
  if (protocolState.type === 'Challenging.AcknowledgeTimeout') {
    const updatedState = transitionToWaitForDefunding(protocolState, sharedData);
    protocolState = updatedState.protocolState;
    sharedData = updatedState.sharedData;
  }
  const retVal = defundingReducer(protocolState.defundingState, sharedData, action);
  const defundingState = retVal.protocolState;

  if (isDefundingSuccess(defundingState)) {
    protocolState = acknowledgeSuccess({ ...protocolState });
  } else if (isDefundingFailure(defundingState)) {
    protocolState = acknowledgeClosedButNotDefunded(protocolState);
  } else {
    // update the transaction state
    protocolState = { ...protocolState, defundingState };
  }
  return { protocolState, sharedData: retVal.sharedData };
}

function challengeApproved(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.ApproveChallenge') {
    return { protocolState, sharedData };
  }
  const channelState = getChannel(sharedData, protocolState.channelId);

  // These shouldn't have changed but the type system doesn't know that. In any case, we
  // might as well be safe. And type-safe...
  if (!channelState) {
    return { protocolState: acknowledgeFailure(protocolState, 'ChannelDoesntExist'), sharedData };
  }
  if (!isFullyOpen(channelState)) {
    return { protocolState: acknowledgeFailure(protocolState, 'NotFullyOpen'), sharedData };
  }

  if (ourTurn(channelState)) {
    // if it's our turn now, a commitment must have arrived while we were approving
    return { protocolState: acknowledgeFailure(protocolState, 'LatestWhileApproving'), sharedData };
  }

  // else if we don't have the last two states
  // make challenge transaction
  const [penultimateCommitment, lastCommitment] = channelState.commitments;
  const { commitment: fromPosition, signature: fromSignature } = penultimateCommitment;
  const { commitment: toPosition, signature: toSignature } = lastCommitment;
  const transactionRequest = createForceMoveTransaction(
    fromPosition,
    toPosition,
    fromSignature,
    toSignature,
  );
  // initialize transaction state machine
  const returnVal = initializeTransaction(
    transactionRequest,
    protocolState.processId,
    protocolState.channelId,
    sharedData,
  );
  const transactionSubmission = returnVal.state;

  // transition to wait for transaction
  const newState = waitForTransaction({ ...protocolState, transactionSubmission });
  return { protocolState: newState, sharedData: returnVal.storage };
}

function challengeDenied(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.ApproveChallenge') {
    return { protocolState, sharedData };
  }

  protocolState = acknowledgeFailure(protocolState, 'DeclinedByUser');
  return { protocolState, sharedData };
}

function refuteReceived(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { protocolState, sharedData };
  }

  protocolState = acknowledgeResponse(protocolState);
  return { protocolState, sharedData };
}

function challengeResponseReceived(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  challengeCommitment: Commitment,
  challengeSignature: string,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { protocolState, sharedData };
  }

  protocolState = acknowledgeResponse(protocolState);
  sharedData = sendChallengeCommitmentReceived(sharedData, challengeCommitment);

  const signedCommitment: SignedCommitment = {
    commitment: challengeCommitment,
    signature: challengeSignature,
  };
  const checkResult = checkAndStore(sharedData, signedCommitment);
  if (checkResult.isSuccess) {
    return { protocolState, sharedData: checkResult.store };
  }

  return { protocolState, sharedData };
}

function challengeTimedOut(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.WaitForResponseOrTimeout') {
    return { protocolState, sharedData };
  }

  protocolState = acknowledgeTimeout(protocolState);
  return { protocolState, sharedData };
}

function challengeResponseAcknowledged(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.AcknowledgeResponse') {
    return { protocolState, sharedData };
  }
  const channelState = getChannel(sharedData, protocolState.channelId);
  const isLedgerChannel = channelState
    ? channelState.libraryAddress === CONSENSUS_LIBRARY_ADDRESS
    : false;
  if (isLedgerChannel) {
    sharedData = yieldToProcess(sharedData);
  } else {
    sharedData = sendChallengeComplete(hideWallet(sharedData));
  }
  return { protocolState: successOpen({}), sharedData };
}

function challengeFailureAcknowledged(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type !== 'Challenging.AcknowledgeFailure') {
    return { protocolState, sharedData };
  }

  return { protocolState: failure(protocolState), sharedData: hideWallet(sharedData) };
}

function defundChosen(protocolState: NonTerminalCState, sharedData: SharedData) {
  if (protocolState.type !== 'Challenging.AcknowledgeTimeout') {
    return { protocolState, sharedData };
  }
  return transitionToWaitForDefunding(protocolState, sharedData);
}
function acknowledged(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<ChallengerState> {
  if (protocolState.type === 'Challenging.AcknowledgeClosedButNotDefunded') {
    return {
      protocolState: successClosedButNotDefunded({}),
      sharedData: sendConcludeSuccess(hideWallet(sharedData)),
    };
    // From the point of view of the app, it is as if we have concluded
  }
  if (protocolState.type === 'Challenging.AcknowledgeSuccess') {
    return {
      protocolState: successClosedAndDefunded({}),
      sharedData: sendConcludeSuccess(hideWallet(sharedData)),
    };
    // From the point of view of the app, it is as if we have concluded
  }
  return { protocolState, sharedData };
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

const transitionToWaitForDefunding = (
  protocolState: NonTerminalCState,
  sharedData: SharedData,
): { protocolState: WaitForDefund; sharedData: SharedData } => {
  // initialize defunding state machine
  const protocolStateWithSharedData = initializeDefunding(
    protocolState.processId,
    protocolState.channelId,
    sharedData,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  sharedData = protocolStateWithSharedData.sharedData;
  return {
    protocolState: waitForDefund({
      ...protocolState,
      defundingState,
    }),
    sharedData,
  };
};
