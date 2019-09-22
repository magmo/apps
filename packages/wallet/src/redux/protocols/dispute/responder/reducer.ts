import { ProtocolStateWithSharedData } from '../..';
import * as states from './states';
import * as actions from './actions';
import { unreachable } from '../../../../utils/reducer-utils';
import * as selectors from '../../../selectors';
import { TwoPartyPlayerIndex } from '../../../types';
import { TransactionRequest } from 'ethers/providers';
import {
  initialize as initTransactionState,
  transactionReducer,
} from '../../transaction-submission/reducer';
import { SharedData, registerChannelToMonitor } from '../../../state';
import { isTransactionAction } from '../../transaction-submission/actions';
import {
  isTerminal,
  TransactionSubmissionState,
  isSuccess,
} from '../../transaction-submission/states';
import {
  showWallet,
  hideWallet,
  sendChallengeResponseRequested,
  sendChallengeComplete,
  sendOpponentConcluded,
} from '../../reducer-helpers';
import { ProtocolAction } from '../../../actions';
import * as _ from 'lodash';
import { SignedState } from 'nitro-protocol';
import { storeState } from '../../../channel-store/reducer';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';

export const initialize = (
  processId: string,
  channelId: string,
  expiryTime: number,
  sharedData: SharedData,
  challengeState: SignedState,
): ProtocolStateWithSharedData<states.ResponderState> => {
  return {
    protocolState: states.waitForApproval({
      processId,
      channelId,
      challengeState,
      expiryTime,
    }),
    sharedData: showWallet(
      registerChannelToMonitor(
        sendChallengeResponseRequested(sharedData, channelId),
        processId,
        channelId,
        [], // TODO: This should be passed a protocol locator
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
    case 'Responding.WaitForApproval':
      return waitForApprovalReducer(protocolState, sharedData, action);
    case 'Responding.WaitForAcknowledgement':
      return waitForAcknowledgementReducer(protocolState, sharedData, action);
    case 'Responding.WaitForResponse':
      return waitForResponseReducer(protocolState, sharedData, action);
    case 'Responding.WaitForTransaction':
      return waitForTransactionReducer(protocolState, sharedData, action);
    case 'Responding.AcknowledgeTimeout':
      return acknowledgeTimeoutReducer(protocolState, sharedData, action);
    case 'Responding.Success':
    case 'Responding.Failure':
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

const waitForTransactionReducer = (
  protocolState: states.WaitForTransaction,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> => {
  if (action.type === 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRED') {
    return {
      protocolState: states.acknowledgeTimeout({ ...protocolState }),
      sharedData: sendOpponentConcluded(sharedData),
    };
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
    case 'WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED':
      const { signedState } = action;

      sharedData = storeState(signedState, sharedData);
      const transaction = {};
      // TODO: implement this with nitro protocol
      // const transaction = TransactionGenerator.createRespondWithMoveTransaction(
      //   signResult.signedCommitment.commitment,
      //   signResult.signedCommitment.signature,
      // );
      return transitionToWaitForTransaction(transaction, protocolState, sharedData);
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRED':
      return {
        protocolState: states.acknowledgeTimeout({ ...protocolState }),
        sharedData: showWallet(sendOpponentConcluded(sharedData)),
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
    case 'WALLET.DISPUTE.RESPONDER.ACKNOWLEDGED':
      return {
        protocolState: states.success({}),
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
    case 'WALLET.DISPUTE.RESPONDER.RESPOND_APPROVED':
      const { challengeState, processId } = protocolState;
      if (!canRespondWithExistingCommitment(protocolState.challengeState, sharedData)) {
        return {
          protocolState: states.waitForResponse(protocolState),
          sharedData: hideWallet(sharedData),
        };
      } else {
        const transaction = craftResponseTransactionWithExistingCommitment(
          processId,
          challengeState,
          sharedData,
        );

        return transitionToWaitForTransaction(transaction, protocolState, sharedData);
      }
    case 'WALLET.ADJUDICATOR.CHALLENGE_EXPIRED':
      return {
        protocolState: states.acknowledgeTimeout({ ...protocolState }),
        sharedData: sendOpponentConcluded(sharedData),
      };

    default:
      return { protocolState, sharedData };
  }
};

function acknowledgeTimeoutReducer(
  protocolState: states.AcknowledgeTimeout,
  sharedData: SharedData,
  action: actions.ResponderAction,
): ProtocolStateWithSharedData<states.ResponderState> {
  if (action.type === 'WALLET.DISPUTE.RESPONDER.ACKNOWLEDGED') {
    return {
      protocolState: states.failure({ reason: states.FailureReason.TimeOut }),
      sharedData: hideWallet(sharedData),
    };
  }
  if (action.type === 'WALLET.DISPUTE.CHALLENGER.EXIT_CHALLENGE') {
    return {
      protocolState: states.failure({ reason: states.FailureReason.TimeOut }),
      sharedData,
    };
  }
  return {
    protocolState,
    sharedData,
  };
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
      protocolState: states.failure({ reason: states.FailureReason.TransactionFailure }),
      sharedData,
    };
  }
};

const transitionToWaitForTransaction = (
  transaction: TransactionRequest,
  protocolState: states.WaitForResponse | states.WaitForApproval,
  sharedData: SharedData,
) => {
  const { processId, channelId } = protocolState;
  const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
    transaction,
    processId,
    channelId,
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
  challengeState: SignedState,
  sharedData: SharedData,
): TransactionRequest => {
  // const {
  //   penultimateCommitment,
  //   lastCommitment,
  //   lastSignature,
  //   penultimateSignature,
  // } = getStoredCommitments(challengeState, sharedData);

  if (canRefute(challengeState, sharedData)) {
    return {};
    // TODO: Implement this with nitro protocol
    // if (canRefuteWithCommitment(lastCommitment, challengeState)) {
    //   return TransactionGenerator.createRefuteTransaction(lastCommitment, lastSignature);
    // } else {
    //   return TransactionGenerator.createRefuteTransaction(
    //     penultimateCommitment,
    //     penultimateSignature,
    //   );
    // }
  } else if (canRespondWithExistingCommitment(challengeState, sharedData)) {
    return {};
  } else {
    // TODO: We should never actually hit this, currently a sanity check to help out debugging
    throw new Error('Cannot refute or respond with existing commitment.');
  }
};

const getStoredStates = (
  challengeState: SignedState,
  sharedData: SharedData,
): {
  lastState: SignedState;
  penultimateState: SignedState;
} => {
  const channelId = getChannelId(challengeState.state.channel);
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  const [penultimateState, lastState] = channelState.signedStates;
  return { penultimateState, lastState };
};

const canRespondWithExistingCommitment = (challengeState: SignedState, sharedData: SharedData) => {
  return (
    canRespondWithExistingMove(challengeState, sharedData) || canRefute(challengeState, sharedData)
  );
};
const canRespondWithExistingMove = (
  challengeState: SignedState,
  sharedData: SharedData,
): boolean => {
  const { penultimateState, lastState } = getStoredStates(challengeState, sharedData);
  return _.isEqual(penultimateState, challengeState) && mover(lastState) !== mover(challengeState);
};

const canRefute = (challengeState: SignedState, sharedData: SharedData) => {
  const { penultimateState, lastState } = getStoredStates(challengeState, sharedData);
  return (
    canRefuteWithCommitment(lastState, challengeState) ||
    canRefuteWithCommitment(penultimateState, challengeState)
  );
};

const canRefuteWithCommitment = (signedState: SignedState, challengeState: SignedState) => {
  return (
    signedState.state.turnNum > challengeState.state.turnNum &&
    mover(signedState) === mover(challengeState)
  );
};

const mover = (signedState: SignedState): TwoPartyPlayerIndex => {
  return signedState.state.turnNum % 2;
};
