import { SharedData, ProtocolStateWithSharedData } from '..';
import * as states from './states';
import * as actions from './actions';
import { WithdrawalAction } from './actions';
import * as selectors from '../../selectors';
import { CommitmentType } from 'fmg-core/lib/commitment';
import {
  createConcludeAndWithdrawTransaction,
  ConcludeAndWithdrawArgs,
} from '../../../utils/transaction-generator';
import { signVerificationData } from '../../../utils/signing-utils';
import { TransactionRequest } from 'ethers/providers';
import { initialize as initTransactionState } from '../transaction-submission/reducer';

export const initialize = (
  withdrawalAmount: string,
  channelId: string,
  processId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.WithdrawalState> => {
  return {
    protocolState: states.waitForApproval({ withdrawalAmount, processId, channelId }),
    sharedData,
  };
};

export const withdrawalReducer = (
  protocolState: states.WithdrawalState,
  sharedData: SharedData,
  action: WithdrawalAction,
): ProtocolStateWithSharedData<states.WithdrawalState> => {
  switch (protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(protocolState, sharedData, action);
    default:
      return { protocolState, sharedData };
    // TODO: unreachable(protocolState);
  }
};

const waitForApprovalReducer = (
  protocolState: states.WaitForApproval,
  sharedData: SharedData,
  action: WithdrawalAction,
): ProtocolStateWithSharedData<states.WithdrawalState> => {
  switch (action.type) {
    case actions.WITHDRAWAL_APPROVED:
      if (!channelIsClosed(protocolState.channelId, sharedData)) {
        return {
          protocolState: states.failure(states.FAILURE_REASONS.CHANNEL_NOT_CLOSED),
          sharedData,
        };
      }
      const { channelId, withdrawalAmount, processId } = protocolState;
      const { withdrawalAddress } = action;
      const transaction = createConcludeAndWithTransaction(
        channelId,
        withdrawalAmount,
        withdrawalAddress,
        sharedData,
      );
      const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
        transaction,
        processId,
        sharedData,
      );

      return {
        protocolState: states.waitForTransaction({
          ...protocolState,
          withdrawalAddress,
          transactionSubmissionState,
        }),
        sharedData: newSharedData,
      };
    case actions.WITHDRAWAL_REJECTED:
      return {
        protocolState: states.failure(states.FAILURE_REASONS.USER_REJECTED),
        sharedData,
      };
    default:
      return { protocolState, sharedData };
  }
};

const channelIsClosed = (channelId: string, sharedData: SharedData): boolean => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  states;
  const { lastCommitment, penultimateCommitment } = channelState;
  return (
    lastCommitment.commitment.commitmentType === CommitmentType.Conclude &&
    penultimateCommitment.commitment.commitmentType === CommitmentType.Conclude
  );
  // TODO: Check if there is a finalized outcome on chain
};

const createConcludeAndWithTransaction = (
  channelId: string,
  withdrawalAmount: string,
  withdrawalAddress: string,
  sharedData: SharedData,
): TransactionRequest => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  const {
    lastCommitment,
    penultimateCommitment,
    participants,
    ourIndex,
    privateKey,
  } = channelState;
  const participant = participants[ourIndex];
  const verificationSignature = signVerificationData(
    participant,
    withdrawalAddress,
    withdrawalAmount,
    withdrawalAddress,
    privateKey,
  );
  const args: ConcludeAndWithdrawArgs = {
    fromCommitment: penultimateCommitment.commitment,
    fromSignature: penultimateCommitment.signature,
    toCommitment: lastCommitment.commitment,
    toSignature: lastCommitment.signature,
    participant,
    amount: withdrawalAmount,
    destination: withdrawalAddress,
    verificationSignature,
  };
  return createConcludeAndWithdrawTransaction(args);
};
