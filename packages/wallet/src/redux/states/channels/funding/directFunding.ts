import { SharedDirectFundingState, TransactionExists } from '../shared';

// state stages
export const A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK =
  'A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK';
export const A_SUBMIT_DEPOSIT_IN_METAMASK = 'A_SUBMIT_DEPOSIT_IN_METAMASK';
export const A_WAIT_FOR_DEPOSIT_CONFIRMATION = 'A_WAIT_FOR_DEPOSIT_CONFIRMATION';
export const A_WAIT_FOR_OPPONENT_DEPOSIT = 'A_WAIT_FOR_OPPONENT_DEPOSIT';
export const B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK =
  'B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK';
export const B_SUBMIT_DEPOSIT_IN_METAMASK = 'B_SUBMIT_DEPOSIT_IN_METAMASK';
export const B_WAIT_FOR_DEPOSIT_CONFIRMATION = 'B_WAIT_FOR_DEPOSIT_CONFIRMATION';
export const A_DEPOSIT_TRANSACTION_FAILED = 'A_DEPOSIT_TRANSACTION_FAILED';
export const B_DEPOSIT_TRANSACTION_FAILED = 'B_DEPOSIT_TRANSACTION_FAILED';

export function directFundingState<T extends SharedDirectFundingState>(
  params: T,
): SharedDirectFundingState {
  const { type, stage, requestedTotalFunds, requestedYourDeposit } = params;
  return { type, stage, requestedTotalFunds, requestedYourDeposit };
}
export interface ADepositTransactionFailed extends SharedDirectFundingState {
  stage: typeof A_DEPOSIT_TRANSACTION_FAILED;
}

export interface BDepositTransactionFailed extends SharedDirectFundingState {
  stage: typeof B_DEPOSIT_TRANSACTION_FAILED;
}

export interface AWaitForDepositToBeSentToMetaMask extends SharedDirectFundingState {
  stage: typeof A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK;
}
export interface ASubmitDepositInMetaMask extends SharedDirectFundingState {
  stage: typeof A_SUBMIT_DEPOSIT_IN_METAMASK;
}

export interface AWaitForDepositConfirmation extends SharedDirectFundingState, TransactionExists {
  stage: typeof A_WAIT_FOR_DEPOSIT_CONFIRMATION;
}

export interface BWaitForDepositToBeSentToMetaMask extends SharedDirectFundingState {
  stage: typeof B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK;
}

export interface BSubmitDepositInMetaMask extends SharedDirectFundingState {
  stage: typeof B_SUBMIT_DEPOSIT_IN_METAMASK;
}

export interface AWaitForOpponentDeposit extends SharedDirectFundingState {
  stage: typeof A_WAIT_FOR_OPPONENT_DEPOSIT;
}

export interface BWaitForDepositConfirmation extends SharedDirectFundingState, TransactionExists {
  stage: typeof B_WAIT_FOR_DEPOSIT_CONFIRMATION;
}

export function aWaitForDepositToBeSentToMetaMask<T extends SharedDirectFundingState>(
  params: T,
): AWaitForDepositToBeSentToMetaMask {
  return {
    stage: A_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
    ...directFundingState(params),
  };
}

export function aSubmitDepositInMetaMask<T extends SharedDirectFundingState>(
  params: T,
): ASubmitDepositInMetaMask {
  return { stage: A_SUBMIT_DEPOSIT_IN_METAMASK, ...directFundingState(params) };
}

export function aWaitForDepositConfirmation<T extends SharedDirectFundingState & TransactionExists>(
  params: T,
): AWaitForDepositConfirmation {
  return {
    stage: A_WAIT_FOR_DEPOSIT_CONFIRMATION,
    ...directFundingState(params),
    transactionHash: params.transactionHash,
  };
}

export function aWaitForOpponentDeposit<T extends SharedDirectFundingState>(
  params: T,
): AWaitForOpponentDeposit {
  return { stage: A_WAIT_FOR_OPPONENT_DEPOSIT, ...directFundingState(params) };
}

export function bWaitForDepositToBeSentToMetaMask<T extends SharedDirectFundingState>(
  params: T,
): BWaitForDepositToBeSentToMetaMask {
  return {
    stage: B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK,
    ...directFundingState(params),
  };
}

export function bSubmitDepositInMetaMask<T extends SharedDirectFundingState>(
  params: T,
): BSubmitDepositInMetaMask {
  return { stage: B_SUBMIT_DEPOSIT_IN_METAMASK, ...directFundingState(params) };
}

export function bWaitForDepositConfirmation<T extends SharedDirectFundingState & TransactionExists>(
  params: T,
): BWaitForDepositConfirmation {
  return {
    stage: B_WAIT_FOR_DEPOSIT_CONFIRMATION,
    ...directFundingState(params),
    transactionHash: params.transactionHash,
  };
}

export function aDepositTransactionFailed<T extends SharedDirectFundingState>(
  params: T,
): ADepositTransactionFailed {
  return { stage: A_DEPOSIT_TRANSACTION_FAILED, ...directFundingState(params) };
}
export function bDepositTransactionFailed<T extends SharedDirectFundingState>(
  params: T,
): BDepositTransactionFailed {
  return { stage: B_DEPOSIT_TRANSACTION_FAILED, ...directFundingState(params) };
}

export type FundingState =
  | AWaitForDepositToBeSentToMetaMask
  | ASubmitDepositInMetaMask
  | AWaitForDepositConfirmation
  | BWaitForDepositToBeSentToMetaMask
  | BSubmitDepositInMetaMask
  | AWaitForOpponentDeposit
  | BWaitForDepositConfirmation
  | ADepositTransactionFailed
  | BDepositTransactionFailed;
