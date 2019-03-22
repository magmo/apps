import {
  UserAddressExists,
  userAddressExists,
  channelOpen,
  ChannelOpen,
  TypedChannelState,
} from '../shared/state';
import { TransactionExists } from '../../shared/state';

// stage
export const WITHDRAWING = 'STAGE.WITHDRAWING';

// state types
export const APPROVE_WITHDRAWAL = 'APPROVE_WITHDRAWAL';
export const WAIT_FOR_WITHDRAWAL_INITIATION = 'WAIT_FOR_WITHDRAWAL_INITIATION';
export const WAIT_FOR_WITHDRAWAL_CONFIRMATION = 'WAIT_FOR_WITHDRAWAL_CONFIRMATION';
export const ACKNOWLEDGE_WITHDRAWAL_SUCCESS = 'ACKNOWLEDGE_WITHDRAWAL_SUCCESS';
export const WITHDRAW_TRANSACTION_FAILED = 'WITHDRAW_TRANSACTION_FAILED';

export interface WithdrawTransactionFailed extends UserAddressExists, TypedChannelState {
  type: typeof WITHDRAW_TRANSACTION_FAILED;
  stage: typeof WITHDRAWING;
}

export interface ApproveWithdrawal extends ChannelOpen, TypedChannelState {
  type: typeof APPROVE_WITHDRAWAL;
  stage: typeof WITHDRAWING;
}

export interface WaitForWithdrawalInitiation extends UserAddressExists, TypedChannelState {
  type: typeof WAIT_FOR_WITHDRAWAL_INITIATION;
  stage: typeof WITHDRAWING;
}

export interface WaitForWithdrawalConfirmation
  extends UserAddressExists,
    TransactionExists,
    TypedChannelState {
  type: typeof WAIT_FOR_WITHDRAWAL_CONFIRMATION;
  stage: typeof WITHDRAWING;
}

export interface AcknowledgeWithdrawalSuccess extends ChannelOpen, TypedChannelState {
  type: typeof ACKNOWLEDGE_WITHDRAWAL_SUCCESS;
  stage: typeof WITHDRAWING;
}

export function approveWithdrawal<T extends ChannelOpen>(params: T): ApproveWithdrawal {
  return {
    ...channelOpen(params),
    type: APPROVE_WITHDRAWAL,
    stage: WITHDRAWING,
    channelType: 'Application',
  };
}

export function waitForWithdrawalInitiation<T extends UserAddressExists>(
  params: T,
): WaitForWithdrawalInitiation {
  return {
    ...userAddressExists(params),
    type: WAIT_FOR_WITHDRAWAL_INITIATION,
    stage: WITHDRAWING,
    channelType: 'Application',
  };
}

export function waitForWithdrawalConfirmation<T extends UserAddressExists & TransactionExists>(
  params: T,
): WaitForWithdrawalConfirmation {
  return {
    ...userAddressExists(params),
    transactionHash: params.transactionHash,
    type: WAIT_FOR_WITHDRAWAL_CONFIRMATION,
    stage: WITHDRAWING,
    channelType: 'Application',
  };
}

export function acknowledgeWithdrawalSuccess<T extends ChannelOpen>(
  params: T,
): AcknowledgeWithdrawalSuccess {
  return {
    ...channelOpen(params),
    type: ACKNOWLEDGE_WITHDRAWAL_SUCCESS,
    stage: WITHDRAWING,
    channelType: 'Application',
  };
}

export function withdrawTransactionFailed<T extends UserAddressExists>(
  params: T,
): WithdrawTransactionFailed {
  return {
    type: WITHDRAW_TRANSACTION_FAILED,
    stage: WITHDRAWING,
    ...userAddressExists(params),
    channelType: 'Application',
  };
}
export type WithdrawingState =
  | ApproveWithdrawal
  | WaitForWithdrawalInitiation
  | WaitForWithdrawalConfirmation
  | AcknowledgeWithdrawalSuccess
  | WithdrawTransactionFailed;
