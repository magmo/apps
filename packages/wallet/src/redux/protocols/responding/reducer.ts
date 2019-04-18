import { Commitment } from 'fmg-core/lib/commitment';
import { ProtocolStateWithSharedData } from '..';
import * as states from './state';
import * as actions from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import * as selectors from '../../selectors';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import * as TransactionGenerator from '../../../utils/transaction-generator';
import { PlayerIndex } from '../../types';
import { TransactionRequest } from 'ethers/providers';
import { initialize as initTransactionState } from '../transaction-submission/reducer';
import { SharedData } from '../../state';

export const initialize = (
  processId: string,
  sharedData: SharedData,
  challengeCommitment: Commitment,
): ProtocolStateWithSharedData<states.RespondingState> => {
  return {
    protocolState: states.waitForApproval({ processId, challengeCommitment }),
    sharedData,
  };
};

export const respondingReducer = (
  protocolState: states.RespondingState,
  sharedData: SharedData,
  action: actions.RespondingAction,
): ProtocolStateWithSharedData<states.RespondingState> => {
  switch (protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(protocolState, sharedData, action);
    case states.WAIT_FOR_ACKNOWLEDGEMENT:
    case states.WAIT_FOR_RESPONSE:
    case states.WAIT_FOR_TRANSACTION:
    case states.SUCCESS:
    case states.FAILURE:
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

const waitForApprovalReducer = (
  protocolState: states.WaitForApproval,
  sharedData: SharedData,
  action: actions.RespondingAction,
): ProtocolStateWithSharedData<states.RespondingState> => {
  switch (action.type) {
    case actions.RESPOND_APPROVED:
      const { challengeCommitment, processId } = protocolState;
      if (!canRespondWithExistingCommitment(protocolState.challengeCommitment, sharedData)) {
        return {
          protocolState: states.waitForResponse(protocolState),
          sharedData,
        };
      } else {
        const transaction = craftResponseTransactionWithExistingCommitment(
          processId,
          challengeCommitment,
          sharedData,
        );
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
          sharedData: newSharedData,
        };
      }
    case actions.RESPOND_REJECTED:
      return {
        protocolState: states.failure(states.FailureReason.UserRejected),
        sharedData,
      };
    default:
      return { protocolState, sharedData };
  }
};

// helpers

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
    penultimateCommitment === challengeCommitment &&
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
    commitment.turnNum > challengeCommitment.turnNum ||
    mover(commitment) === mover(challengeCommitment)
  );
};

const mover = (commitment: Commitment): PlayerIndex => {
  return commitment.turnNum % 2;
};
