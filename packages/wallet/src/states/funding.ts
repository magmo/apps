import { ChannelOpen, channelOpen, TransactionExists, } from './shared';

// stage
export const FUNDING = 'FUNDING';

// state types
export const WAIT_FOR_FUNDING_REQUEST = 'WAIT_FOR_FUNDING_REQUEST';
export const APPROVE_FUNDING = 'APPROVE_FUNDING';
export const A_WAIT_FOR_DEPLOY_TO_BE_SENT_TO_METAMASK = 'A_WAIT_FOR_DEPLOY_TO_BE_SENT_TO_METAMASK';
export const A_SUBMIT_DEPLOY_IN_METAMASK = 'A_SUBMIT_DEPLOY_IN_METAMASK';
export const WAIT_FOR_DEPLOY_CONFIRMATION = 'WAIT_FOR_DEPLOY_CONFIRMATION';
export const A_WAIT_FOR_DEPOSIT = 'A_WAIT_FOR_DEPOSIT';
export const A_WAIT_FOR_POST_FUND_SETUP = 'A_WAIT_FOR_POST_FUND_SETUP';
export const B_WAIT_FOR_DEPLOY_ADDRESS = 'B_WAIT_FOR_DEPLOY_ADDRESS';
export const B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK = 'B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK';
export const B_SUBMIT_DEPOSIT_IN_METAMASK = 'B_SUBMIT_DEPOSIT_IN_METAMASK';
export const WAIT_FOR_DEPOSIT_CONFIRMATION = 'WAIT_FOR_DEPOSIT_CONFIRMATION';
export const B_WAIT_FOR_POST_FUND_SETUP = 'B_WAIT_FOR_POST_FUND_SETUP';
export const ACKNOWLEDGE_FUNDING_SUCCESS = 'ACKNOWLEDGE_FUNDING_SUCCESS';
export const SEND_FUNDING_DECLINED_MESSAGE = 'SEND_FUNDING_DECLINED_MESSAGE';
export const ACKNOWLEDGE_FUNDING_DECLINED = 'ACKNOWLEDGE_FUNDING_DECLINED';
export const DEPLOY_TRANSACTION_FAILED = 'DEPLOY_TRANSACTION_FAILED';
export const DEPOSIT_TRANSACTION_FAILED = 'DEPOSIT_TRANSACTION_FAILED';

export interface DeployTransactionFailed extends ChannelOpen {
  type: typeof DEPLOY_TRANSACTION_FAILED;
  stage: typeof FUNDING;
}

export interface DepositTransactionFailed extends ChannelOpen {
  type: typeof DEPOSIT_TRANSACTION_FAILED;
  stage: typeof FUNDING;
}

export interface SendFundingDeclinedMessage extends ChannelOpen {
  type: typeof SEND_FUNDING_DECLINED_MESSAGE;
  stage: typeof FUNDING;
}

export interface WaitForFundingRequest extends ChannelOpen {
  type: typeof WAIT_FOR_FUNDING_REQUEST;
  stage: typeof FUNDING;
}

export interface ApproveFunding extends ChannelOpen {
  type: typeof APPROVE_FUNDING;
  stage: typeof FUNDING;
}

export interface AWaitForDeployToBeSentToMetaMask extends ChannelOpen {
  type: typeof A_WAIT_FOR_DEPLOY_TO_BE_SENT_TO_METAMASK;
  stage: typeof FUNDING;
}
export interface ASubmitDeployInMetaMask extends ChannelOpen {
  type: typeof A_SUBMIT_DEPLOY_IN_METAMASK;
  stage: typeof FUNDING;
}

export interface BWaitForDeployAddress extends ChannelOpen {
  type: typeof B_WAIT_FOR_DEPLOY_ADDRESS;
  stage: typeof FUNDING;
}

export interface WaitForDeployConfirmation extends ChannelOpen, TransactionExists {
  type: typeof WAIT_FOR_DEPLOY_CONFIRMATION;
  stage: typeof FUNDING;
}

export interface BWaitForDepositToBeSentToMetaMask extends ChannelOpen {
  type: typeof B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK;
  stage: typeof FUNDING;
}

export interface BSubmitDepositInMetaMask extends ChannelOpen {
  type: typeof B_SUBMIT_DEPOSIT_IN_METAMASK;
  stage: typeof FUNDING;
}

export interface AWaitForDeposit extends ChannelOpen {
  type: typeof A_WAIT_FOR_DEPOSIT;
  stage: typeof FUNDING;
}

export interface WaitForDepositConfirmation extends ChannelOpen, TransactionExists {
  type: typeof WAIT_FOR_DEPOSIT_CONFIRMATION;
  stage: typeof FUNDING;
}


export interface AWaitForPostFundSetup extends ChannelOpen {
  type: typeof A_WAIT_FOR_POST_FUND_SETUP;
  stage: typeof FUNDING;
}

export interface BWaitForPostFundSetup extends ChannelOpen {
  type: typeof B_WAIT_FOR_POST_FUND_SETUP;
  stage: typeof FUNDING;
}

export interface AcknowledgeFundingSuccess extends ChannelOpen {
  type: typeof ACKNOWLEDGE_FUNDING_SUCCESS;
  stage: typeof FUNDING;
}

export interface AcknowledgeFundingDeclined extends ChannelOpen {
  type: typeof ACKNOWLEDGE_FUNDING_DECLINED;
  stage: typeof FUNDING;
}

export function waitForFundingRequest<T extends ChannelOpen>(params: T): WaitForFundingRequest {
  return { type: WAIT_FOR_FUNDING_REQUEST, stage: FUNDING, ...channelOpen(params) };
}

export function approveFunding<T extends ChannelOpen>(params: T): ApproveFunding {
  return { type: APPROVE_FUNDING, stage: FUNDING, ...channelOpen(params) };
}

export function aWaitForDeployToBeSentToMetaMask<T extends ChannelOpen>(params: T): AWaitForDeployToBeSentToMetaMask {
  return { type: A_WAIT_FOR_DEPLOY_TO_BE_SENT_TO_METAMASK, stage: FUNDING, ...channelOpen(params) };
}

export function aSubmitDeployInMetaMask<T extends ChannelOpen>(params: T): ASubmitDeployInMetaMask {
  return { type: A_SUBMIT_DEPLOY_IN_METAMASK, stage: FUNDING, ...channelOpen(params) };
}

export function bWaitForDeployAddress<T extends ChannelOpen>(params: T): BWaitForDeployAddress {
  return { type: B_WAIT_FOR_DEPLOY_ADDRESS, stage: FUNDING, ...channelOpen(params) };
}

export function waitForDeployConfirmation<T extends ChannelOpen & TransactionExists>(params: T): WaitForDeployConfirmation {
  return { type: WAIT_FOR_DEPLOY_CONFIRMATION, stage: FUNDING, ...channelOpen(params), transactionHash: params.transactionHash };
}

export function aWaitForDeposit<T extends ChannelOpen>(params: T): AWaitForDeposit {
  return { type: A_WAIT_FOR_DEPOSIT, stage: FUNDING, ...channelOpen(params) };
}

export function bWaitForDepositToBeSentToMetaMask<T extends ChannelOpen>(params: T): BWaitForDepositToBeSentToMetaMask {
  return { type: B_WAIT_FOR_DEPOSIT_TO_BE_SENT_TO_METAMASK, stage: FUNDING, ...channelOpen(params) };
}

export function bSubmitDepositInMetaMask<T extends ChannelOpen>(params: T): BSubmitDepositInMetaMask {
  return { type: B_SUBMIT_DEPOSIT_IN_METAMASK, stage: FUNDING, ...channelOpen(params) };
}

export function waitForDepositConfirmation<T extends ChannelOpen & TransactionExists>(params: T): WaitForDepositConfirmation {
  return { type: WAIT_FOR_DEPOSIT_CONFIRMATION, stage: FUNDING, ...channelOpen(params), transactionHash: params.transactionHash };
}

export function aWaitForPostFundSetup<T extends ChannelOpen>(params: T): AWaitForPostFundSetup {
  return { type: A_WAIT_FOR_POST_FUND_SETUP, stage: FUNDING, ...channelOpen(params) };
}

export function bWaitForPostFundSetup<T extends ChannelOpen>(params: T): BWaitForPostFundSetup {
  return { type: B_WAIT_FOR_POST_FUND_SETUP, stage: FUNDING, ...channelOpen(params) };
}

export function acknowledgeFundingSuccess<T extends ChannelOpen>(params: T): AcknowledgeFundingSuccess {
  return { type: ACKNOWLEDGE_FUNDING_SUCCESS, stage: FUNDING, ...channelOpen(params) };
}

export function sendFundingDeclinedMessage<T extends ChannelOpen>(params: T): SendFundingDeclinedMessage {
  return { type: SEND_FUNDING_DECLINED_MESSAGE, stage: FUNDING, ...channelOpen(params) };
}

export function acknowledgeFundingDeclined<T extends ChannelOpen>(params: T): AcknowledgeFundingDeclined {
  return { type: ACKNOWLEDGE_FUNDING_DECLINED, stage: FUNDING, ...channelOpen(params) };

}

export function deployTransactionFailed<T extends ChannelOpen>(params: T): DeployTransactionFailed {
  return { type: DEPLOY_TRANSACTION_FAILED, stage: FUNDING, ...channelOpen(params) };
}
export function depositTransactionFailed<T extends ChannelOpen>(params: T): DepositTransactionFailed {
  return { type: DEPOSIT_TRANSACTION_FAILED, stage: FUNDING, ...channelOpen(params) };
}

export type FundingState = (
  | WaitForFundingRequest
  | ApproveFunding
  | AWaitForDeployToBeSentToMetaMask
  | ASubmitDeployInMetaMask
  | BWaitForDeployAddress
  | WaitForDeployConfirmation
  | BWaitForDepositToBeSentToMetaMask
  | BSubmitDepositInMetaMask
  | AWaitForDeposit
  | WaitForDepositConfirmation
  | BWaitForPostFundSetup
  | AWaitForPostFundSetup
  | AcknowledgeFundingSuccess
  | SendFundingDeclinedMessage
  | AcknowledgeFundingDeclined
  | DeployTransactionFailed
  | DepositTransactionFailed
);
