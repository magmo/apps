import { bigNumberify } from 'ethers/utils';
import { ProtocolStateWithSharedData } from '..';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import { SharedData } from '../../state';
import { initialize as initTransactionState } from '../transaction-submission/reducer';
import { NonTerminalTransactionSubmissionState } from '../transaction-submission/states';
import { Properties, StateConstructor } from '../../utils';
import { DirectFundingRequested } from './actions';

// -------
// States
// -------

// Funding status

export type ChannelFundingStatus =
  | 'DirectFunding.NotSafeToDeposit'
  | 'DirectFunding.WaitForDepositTransaction'
  | 'DirectFunding.WaitForFundingAndPostFundSetup'
  | 'DirectFunding.WaitForDepositTransaction'
  | 'DirectFunding.FundingSuccess'
  | 'DirectFunding.FundingFailure';

export const DIRECT_FUNDING = 'FUNDING_TYPE.DIRECT';

export interface BaseDirectFundingState {
  processId: string;
  safeToDepositLevel: string;
  type: ChannelFundingStatus;
  requestedTotalFunds: string;
  requestedYourContribution: string;
  channelId: string;
  ourIndex: number;
}

export interface NotSafeToDeposit extends BaseDirectFundingState {
  type: 'DirectFunding.NotSafeToDeposit';
}

export interface WaitForDepositTransaction extends BaseDirectFundingState {
  type: 'DirectFunding.WaitForDepositTransaction';
  transactionSubmissionState: NonTerminalTransactionSubmissionState;
}
export interface WaitForFundingAndPostFundSetup extends BaseDirectFundingState {
  type: 'DirectFunding.WaitForFundingAndPostFundSetup';
  channelFunded: boolean;
  postFundSetupReceived: boolean;
}
export interface FundingSuccess extends BaseDirectFundingState {
  type: 'DirectFunding.FundingSuccess';
}

export interface FundingFailure extends BaseDirectFundingState {
  type: 'DirectFunding.FundingFailure';
}

// ------------
// Constructors
// ------------

export const baseDirectFundingState: StateConstructor<BaseDirectFundingState> = params => {
  const {
    processId,
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    safeToDepositLevel,
    type: channelFundingStatus,
  } = params;
  return {
    processId,
    requestedTotalFunds,
    requestedYourContribution,
    channelId,
    ourIndex,
    safeToDepositLevel,
    type: channelFundingStatus,
  };
};

export const notSafeToDeposit: StateConstructor<NotSafeToDeposit> = params => {
  return {
    ...baseDirectFundingState(params),
    type: 'DirectFunding.NotSafeToDeposit',
  };
};

export function waitForDepositTransaction(
  params: Properties<WaitForDepositTransaction>,
): WaitForDepositTransaction {
  const { transactionSubmissionState } = params;
  return {
    ...baseDirectFundingState(params),
    type: 'DirectFunding.WaitForDepositTransaction',
    transactionSubmissionState,
  };
}
export const waitForFundingAndPostFundSetup: StateConstructor<
  WaitForFundingAndPostFundSetup
> = params => {
  return {
    ...baseDirectFundingState(params),
    channelFunded: params.channelFunded,
    postFundSetupReceived: params.postFundSetupReceived,
    type: 'DirectFunding.WaitForFundingAndPostFundSetup',
  };
};

export const fundingSuccess: StateConstructor<FundingSuccess> = params => {
  return {
    ...baseDirectFundingState(params),
    type: 'DirectFunding.FundingSuccess',
  };
};

export const fundingFailure: StateConstructor<FundingFailure> = params => {
  return {
    ...baseDirectFundingState(params),
    type: 'DirectFunding.FundingFailure',
  };
};

export function initialDirectFundingState(
  action: DirectFundingRequested,
  sharedData: SharedData,
): ProtocolStateWithSharedData<DirectFundingState> {
  const { safeToDepositLevel, totalFundingRequired, requiredDeposit, channelId, ourIndex } = action;

  const alreadySafeToDeposit = bigNumberify(safeToDepositLevel).eq('0x');
  const alreadyFunded = bigNumberify(totalFundingRequired).eq('0x');

  if (alreadyFunded) {
    return {
      protocolState: fundingSuccess({
        processId: action.processId,
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
    const depositTransaction = createDepositTransaction(
      action.channelId,
      action.requiredDeposit,
      action.safeToDepositLevel,
    );
    const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
      depositTransaction,
      action.processId,
      sharedData,
    );

    return {
      protocolState: waitForDepositTransaction({
        processId: action.processId,
        requestedTotalFunds: totalFundingRequired,
        requestedYourContribution: requiredDeposit,
        channelId,
        ourIndex,
        safeToDepositLevel,
        transactionSubmissionState,
      }),
      sharedData: newSharedData,
    };
  }

  return {
    protocolState: notSafeToDeposit({
      processId: action.processId,
      requestedTotalFunds: totalFundingRequired,
      requestedYourContribution: requiredDeposit,
      channelId,
      ourIndex,
      safeToDepositLevel,
    }),
    sharedData,
  };
}

// -------
// Unions and Guards
// -------

export type DirectFundingState =
  | NotSafeToDeposit
  | WaitForDepositTransaction
  | WaitForFundingAndPostFundSetup
  | FundingSuccess
  | FundingFailure;

export type DirectFundingStateType = DirectFundingState['type'];

export function isTerminal(state: DirectFundingState): state is FundingFailure | FundingSuccess {
  return (
    state.type === 'DirectFunding.FundingFailure' || state.type === 'DirectFunding.FundingSuccess'
  );
}

export function isSuccess(state: DirectFundingState): state is FundingSuccess {
  return state.type === 'DirectFunding.FundingSuccess';
}

export function isFailure(state: DirectFundingState): state is FundingFailure {
  return state.type === 'DirectFunding.FundingFailure';
}
