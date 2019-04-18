import { bigNumberify } from 'ethers/utils';
import { ProtocolStateWithSharedData } from '..';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import { DirectFundingRequested } from '../../internal/actions';
import { SharedData } from '../../state';
import { initialize as initTransactionState } from '../transaction-submission/reducer';
import { TransactionSubmissionState } from '../transaction-submission/states';
import { Properties } from '../../utils';

// ChannelFundingStatus
export const NOT_SAFE_TO_DEPOSIT = 'NOT_SAFE_TO_DEPOSIT';
export const WAIT_FOR_DEPOSIT_TRANSACTION = 'WAIT_FOR_DEPOSIT_TRANSACTION';
export const WAIT_FOR_FUNDING_CONFIRMATION = 'WAIT_FOR_FUNDING_CONFIRMATION';
export const CHANNEL_FUNDED = 'CHANNEL_FUNDED';
// Funding status
export type ChannelFundingStatus =
  | typeof NOT_SAFE_TO_DEPOSIT
  | typeof WAIT_FOR_DEPOSIT_TRANSACTION
  | typeof WAIT_FOR_FUNDING_CONFIRMATION
  | typeof CHANNEL_FUNDED;
export const DIRECT_FUNDING = 'FUNDING_TYPE.DIRECT';
export interface BaseDirectFundingState {
  safeToDepositLevel: string;
  type: ChannelFundingStatus;
  requestedTotalFunds: string;
  requestedYourContribution: string;
  channelId: string;
  ourIndex: number;
}
export interface NotSafeToDeposit extends BaseDirectFundingState {
  type: typeof NOT_SAFE_TO_DEPOSIT;
}
export interface WaitForDepositTransaction extends BaseDirectFundingState {
  type: typeof WAIT_FOR_DEPOSIT_TRANSACTION;
  transactionSubmissionState: TransactionSubmissionState;
}
export interface WaitForFundingConfirmation extends BaseDirectFundingState {
  type: typeof WAIT_FOR_FUNDING_CONFIRMATION;
}
export interface ChannelFunded extends BaseDirectFundingState {
  type: typeof CHANNEL_FUNDED;
}
// constructors
export function baseDirectFundingState(
  params: Properties<BaseDirectFundingState>,
): BaseDirectFundingState {
  const {
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    safeToDepositLevel,
    type: channelFundingStatus,
  } = params;
  return {
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    safeToDepositLevel,
    type: channelFundingStatus,
  };
}
export function notSafeToDeposit(params: Properties<BaseDirectFundingState>): NotSafeToDeposit {
  return {
    ...baseDirectFundingState(params),
    type: NOT_SAFE_TO_DEPOSIT,
  };
}
export function waitForDepositTransaction(
  params: Properties<BaseDirectFundingState>,
  transactionSubmissionState: TransactionSubmissionState,
): WaitForDepositTransaction {
  return {
    ...baseDirectFundingState(params),
    type: WAIT_FOR_DEPOSIT_TRANSACTION,
    transactionSubmissionState,
  };
}
export function waitForFundingConfirmation<T extends BaseDirectFundingState>(
  params: Properties<BaseDirectFundingState>,
): WaitForFundingConfirmation {
  return {
    ...baseDirectFundingState(params),
    type: WAIT_FOR_FUNDING_CONFIRMATION,
  };
}
export function channelFunded(params: Properties<BaseDirectFundingState>): ChannelFunded {
  return {
    ...baseDirectFundingState(params),
    type: CHANNEL_FUNDED,
  };
}
export type DirectFundingState =
  | NotSafeToDeposit
  | WaitForDepositTransaction
  | WaitForFundingConfirmation
  | ChannelFunded;

export function initialDirectFundingState(
  action: DirectFundingRequested,
  sharedData: SharedData,
): ProtocolStateWithSharedData<DirectFundingState> {
  const { safeToDepositLevel, totalFundingRequired, requiredDeposit, channelId, ourIndex } = action;

  const alreadySafeToDeposit = bigNumberify(safeToDepositLevel).eq('0x');
  const alreadyFunded = bigNumberify(totalFundingRequired).eq('0x');

  if (alreadyFunded) {
    return {
      protocolState: channelFunded({
        requestedTotalFunds: totalFundingRequired,
        requestedYourContribution: requiredDeposit,
        channelId,
        ourIndex,
        safeToDepositLevel,
      }),
      sharedData,
    };
  }

  if (alreadySafeToDeposit) {
    const depositTransaction = createDepositTransaction(action.channelId, action.requiredDeposit);
    const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
      depositTransaction,
      `direct-funding.${action.channelId}`, // TODO: what is the correct way of fetching the process id?
      sharedData,
    );

    return {
      protocolState: waitForDepositTransaction(
        {
          requestedTotalFunds: totalFundingRequired,
          requestedYourContribution: requiredDeposit,
          channelId,
          ourIndex,
          safeToDepositLevel,
        },
        transactionSubmissionState,
      ),
      sharedData: newSharedData,
    };
  }

  return {
    protocolState: notSafeToDeposit({
      requestedTotalFunds: totalFundingRequired,
      requestedYourContribution: requiredDeposit,
      channelId,
      ourIndex,
      safeToDepositLevel,
    }),
    sharedData,
  };
}
