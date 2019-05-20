import { Commitment } from '../../../../domain';
import { ProtocolStateWithSharedData } from '../..';
import * as states from './state';
import * as actions from './actions';
import { unreachable } from '../../../../utils/reducer-utils';
import * as selectors from '../../../selectors';
import * as TransactionGenerator from '../../../../utils/transaction-generator';
import { PlayerIndex } from '../../../types';
import { TransactionRequest } from 'ethers/providers';
import {
  initialize as initTransactionState,
  transactionReducer,
} from '../../transaction-submission/reducer';
import { SharedData, signAndStore, registerChannelToMonitor } from '../../../state';
import { isTransactionAction } from '../../transaction-submission/actions';
import {
  isTerminal,
  TransactionSubmissionState,
  isSuccess,
} from '../../transaction-submission/states';
import { channelID } from 'fmg-core/lib/channel';
import {
  showWallet,
  hideWallet,
  sendChallengeResponseRequested,
  sendChallengeComplete,
  sendOpponentConcluded,
} from '../../reducer-helpers';
import { ProtocolAction, CHALLENGE_EXPIRED_EVENT } from '../../../actions';
import * as _ from 'lodash';
import { isDefundingAction, DefundingAction } from '../../defunding/actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
import {
  isSuccess as isDefundingSuccess,
  isFailure as isDefundingFailure,
} from '../../defunding/states';
export const initialize = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
  challengeCommitment: Commitment,
): ProtocolStateWithSharedData<states.ResponderState> => {
  return {
    protocolState: states.waitForApproval({ processId, channelId, challengeCommitment }),
    sharedData: showWallet(
      registerChannelToMonitor(
        sendChallengeResponseRequested(sharedData, channelId),
        processId,
        channelId,
      ),
    ),
  };
};

export const responderReducer = (
  protocolState: states.ResponderState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  if (!actions.isResponderAction(action)) {
    console.warn(`Challenge Responding Reducer called with non responding action ${action.type}`);
    return { protocolState, sharedData };
  }
  switch (protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_ACKNOWLEDGEMENT:
      return waitForAcknowledgementReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_RESPONSE:
      return waitForResponseReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_TRANSACTION:
      return waitForTransactionReducer(protocolState, sharedData, action);
    case states.ACKNOWLEDGE_TIMEOUT:
      if (isDefundingAction(action)) {
        return handleDefundingAction(protocolState, sharedData, action);
      }
      return acknowledgeTimeoutReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_DEFUND:
      if (isDefundingAction(action)) {
        return handleDefundingAction(protocolState, sharedData, action);
      } else {
        return { protocolState, sharedData };
      }
    case states.ACKNOWLEDGE_DEFUNDING_SUCCESS:
      return acknowledgeDefundingSuccessReducer(protocolState, sharedData, action);
    case states.ACKNOWLEDGE_CLOSED_BUT_NOT_DEFUNDED:
      return acknowledgeClosedButNotDefundedReducer(protocolState, sharedData, action);
    case states.CLOSED_AND_DEFUNDED:
    case states.CLOSED_BUT_NOT_DEFUNDED:
    case states.SUCCESS:
    case states.FAILURE:
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

function handleDefundingAction(
  protocolState: states.ResponderState,
  sharedData: SharedData,
  action: DefundingAction,
): ProtocolStateWithSharedData<states.ResponderState> {
  if (
    protocolState.type !== states.WAIT_FOR_DEFUND &&
    protocolState.type !== states.ACKNOWLEDGE_TIMEOUT
  ) {
    return { protocolState, sharedData };
  }

  // If we received a defunding action before we acknowledge the timeout
  // we transition right into defunding
  if (protocolState.type === states.ACKNOWLEDGE_TIMEOUT) {
    const updatedState = transitionToWaitForDefunding(protocolState, sharedData);
    protocolState = updatedState.protocolState;
    sharedData = updatedState.sharedData;
  }

  const retVal = defundingReducer(protocolState.defundingState, sharedData, action);
  const defundingState = retVal.protocolState;

  if (isDefundingSuccess(defundingState)) {
    protocolState = states.acknowledgeDefundingSuccess({ ...protocolState });
  } else if (isDefundingFailure(defundingState)) {
    protocolState = states.acknowledgeClosedButNotDefunded(protocolState);
  } else {
    // update the defunding state
    protocolState = { ...protocolState, defundingState };
  }
  return { protocolState, sharedData: retVal.sharedData };
}

const waitForTransactionReducer = (
  protocolState: states.WaitForTransaction,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  if (action.type === CHALLENGE_EXPIRED_EVENT) {
    return { protocolState: states.acknowledgeTimeout({ ...protocolState }), sharedData };
  }
  if (!isTransactionAction(action)) {
    return { sharedData, protocolState };
  }
  const { storage: newSharedData, state: newTransactionState } = transactionReducer(
    protocolState.transactionSubmissionState,
    sharedData,
    action,
  );
  if (!isTerminal(newTransactionState)) {
    return {
      sharedData: newSharedData,
      protocolState: { ...protocolState, transactionSubmissionState: newTransactionState },
    };
  } else {
    return handleTransactionSubmissionComplete(protocolState, newTransactionState, newSharedData);
  }
};
const waitForResponseReducer = (
  protocolState: states.WaitForResponse,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  switch (action.type) {
    case actions.RESPONSE_PROVIDED:
      const { commitment } = action;
      const signResult = signAndStore(sharedData, commitment);
      if (!signResult.isSuccess) {
        throw new Error(`Could not sign response commitment due to ${signResult.reason}`);
      }
      const transaction = TransactionGenerator.createRespondWithMoveTransaction(
        signResult.signedCommitment.commitment,
        signResult.signedCommitment.signature,
      );
      return transitionToWaitForTransaction(transaction, protocolState, signResult.store);
    case CHALLENGE_EXPIRED_EVENT:
      return {
        protocolState: states.acknowledgeTimeout({ ...protocolState }),
        sharedData: showWallet(sharedData),
      };

    default:
      return { protocolState, sharedData };
  }
};

const waitForAcknowledgementReducer = (
  protocolState: states.WaitForAcknowledgement,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  switch (action.type) {
    case actions.RESPOND_SUCCESS_ACKNOWLEDGED:
      return {
        protocolState: states.success(),
        sharedData: sendChallengeComplete(hideWallet(sharedData)),
      };
    default:
      return { protocolState, sharedData };
  }
};

const waitForApprovalReducer = (
  protocolState: states.WaitForApproval,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  switch (action.type) {
    case actions.RESPOND_APPROVED:
      const { challengeCommitment, processId } = protocolState;
      if (!canRespondWithExistingCommitment(protocolState.challengeCommitment, sharedData)) {
        return {
          protocolState: states.waitForResponse(protocolState),
          sharedData: hideWallet(sharedData),
        };
      } else {
        const transaction = craftResponseTransactionWithExistingCommitment(
          processId,
          challengeCommitment,
          sharedData,
        );

        return transitionToWaitForTransaction(transaction, protocolState, sharedData);
      }
    case CHALLENGE_EXPIRED_EVENT:
      return { protocolState: states.acknowledgeTimeout({ ...protocolState }), sharedData };

    default:
      return { protocolState, sharedData };
  }
};

function acknowledgeTimeoutReducer(
  protocolState: states.AcknowledgeTimeout,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> {
  if (action.type !== 'WALLET.RESPOND.DEFUND_CHOSEN') {
    return { protocolState, sharedData };
  }
  return transitionToWaitForDefunding(protocolState, sharedData);
}

function acknowledgeDefundingSuccessReducer(
  protocolState: states.AcknowledgeDefundingSuccess,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> {
  if (action.type !== 'WALLET.RESPOND.ACKNOWLEDGED') {
    return { protocolState, sharedData };
  }
  return {
    protocolState: states.closedAndDefunded(),
    sharedData: sendOpponentConcluded(hideWallet(sharedData)),
  };
  // From the point of view of the app, it is as if we have concluded
}

function acknowledgeClosedButNotDefundedReducer(
  protocolState: states.AcknowledgeClosedButNotDefunded,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> {
  if (action.type !== 'WALLET.RESPOND.ACKNOWLEDGED') {
    return { protocolState, sharedData };
  }
  return {
    protocolState: states.closedButNotDefunded(),
    sharedData: sendOpponentConcluded(hideWallet(sharedData)),
  };
  // From the point of view of the app, it is as if we have concluded
}
// helpers
const handleTransactionSubmissionComplete = (
  protocolState: states.WaitForTransaction,
  transactionState: TransactionSubmissionState,
  sharedData: SharedData,
) => {
  if (isSuccess(transactionState)) {
    return {
      protocolState: states.waitForAcknowledgement(protocolState),
      sharedData,
    };
  } else {
    return {
      protocolState: states.failure(states.FailureReason.TransactionFailure),
      sharedData,
    };
  }
};

const transitionToWaitForTransaction = (
  transaction: TransactionRequest,
  protocolState: states.WaitForResponse | states.WaitForApproval,
  sharedData: SharedData,
) => {
  const { processId } = protocolState;
  const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
    transaction,
    processId,
    sharedData,
  );
  const newProtocolState = states.waitForTransaction({
    ...protocolState,
    transactionSubmissionState,
  });
  return {
    protocolState: newProtocolState,
    sharedData: showWallet(newSharedData),
  };
};

const craftResponseTransactionWithExistingCommitment = (
  processId: string,
  challengeCommitment: Commitment,
  sharedData: SharedData,
): TransactionRequest => {
  const {
    penultimateCommitment,
    lastCommitment,
    lastSignature,
    penultimateSignature,
  } = getStoredCommitments(challengeCommitment, sharedData);

  if (canRefute(challengeCommitment, sharedData)) {
    if (canRefuteWithCommitment(lastCommitment, challengeCommitment)) {
      return TransactionGenerator.createRefuteTransaction(lastCommitment, lastSignature);
    } else {
      return TransactionGenerator.createRefuteTransaction(
        penultimateCommitment,
        penultimateSignature,
      );
    }
  } else if (canRespondWithExistingCommitment(challengeCommitment, sharedData)) {
    return TransactionGenerator.createRespondWithMoveTransaction(lastCommitment, lastSignature);
  } else {
    // TODO: We should never actually hit this, currently a sanity check to help out debugging
    throw new Error('Cannot refute or respond with existing commitment.');
  }
};

const getStoredCommitments = (
  challengeCommitment: Commitment,
  sharedData: SharedData,
): {
  lastCommitment: Commitment;
  penultimateCommitment: Commitment;
  lastSignature: string;
  penultimateSignature: string;
} => {
  const channelId = channelID(challengeCommitment.channel);
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  const lastCommitment = channelState.lastCommitment.commitment;
  const penultimateCommitment = channelState.penultimateCommitment.commitment;
  const lastSignature = channelState.lastCommitment.signature;
  const penultimateSignature = channelState.penultimateCommitment.signature;
  return { lastCommitment, penultimateCommitment, lastSignature, penultimateSignature };
};

const canRespondWithExistingCommitment = (
  challengeCommitment: Commitment,
  sharedData: SharedData,
) => {
  return (
    canRespondWithExistingMove(challengeCommitment, sharedData) ||
    canRefute(challengeCommitment, sharedData)
  );
};
const canRespondWithExistingMove = (
  challengeCommitment: Commitment,
  sharedData: SharedData,
): boolean => {
  const { penultimateCommitment, lastCommitment } = getStoredCommitments(
    challengeCommitment,
    sharedData,
  );
  return (
    _.isEqual(penultimateCommitment, challengeCommitment) &&
    mover(lastCommitment) !== mover(challengeCommitment)
  );
};

const canRefute = (challengeCommitment: Commitment, sharedData: SharedData) => {
  const { penultimateCommitment, lastCommitment } = getStoredCommitments(
    challengeCommitment,
    sharedData,
  );
  return (
    canRefuteWithCommitment(lastCommitment, challengeCommitment) ||
    canRefuteWithCommitment(penultimateCommitment, challengeCommitment)
  );
};

const canRefuteWithCommitment = (commitment: Commitment, challengeCommitment: Commitment) => {
  return (
    commitment.turnNum > challengeCommitment.turnNum &&
    mover(commitment) === mover(challengeCommitment)
  );
};

const mover = (commitment: Commitment): PlayerIndex => {
  return commitment.turnNum % 2;
};

const transitionToWaitForDefunding = (
  protocolState: states.NonTerminalResponderState,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.WaitForDefund> => {
  // initialize defunding state machine
  const protocolStateWithSharedData = initializeDefunding(
    protocolState.processId,
    protocolState.channelId,
    sharedData,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  sharedData = protocolStateWithSharedData.sharedData;
  return {
    protocolState: states.waitForDefund({
      ...protocolState,
      defundingState,
    }),
    sharedData,
  };
};
