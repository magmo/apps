/**
 * The term 'funding' is a bit overloaded here, as it is referring to the stage of the channel, as well as
 * the actual funding of the channel.
 */

import { ChannelOpen, channelOpen } from '../shared';

// stage
export const FUNDING = 'FUNDING';

// state types
export const WAIT_FOR_FUNDING_REQUEST = 'WAIT_FOR_FUNDING_REQUEST';
export const APPROVE_FUNDING = 'APPROVE_FUNDING';
export const A_WAIT_FOR_POST_FUND_SETUP = 'A_WAIT_FOR_POST_FUND_SETUP';
export const B_WAIT_FOR_OPPONENT_DEPOSIT = 'B_WAIT_FOR_OPPONENT_DEPOSIT';
export const B_WAIT_FOR_POST_FUND_SETUP = 'B_WAIT_FOR_POST_FUND_SETUP';
export const ACKNOWLEDGE_FUNDING_SUCCESS = 'ACKNOWLEDGE_FUNDING_SUCCESS';
export const SEND_FUNDING_DECLINED_MESSAGE = 'SEND_FUNDING_DECLINED_MESSAGE';
export const ACKNOWLEDGE_FUNDING_DECLINED = 'ACKNOWLEDGE_FUNDING_DECLINED';

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

export interface BWaitForOpponentDeposit extends ChannelOpen {
  type: typeof B_WAIT_FOR_OPPONENT_DEPOSIT;
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

export function bWaitForOpponentDeposit<T extends ChannelOpen>(params: T): BWaitForOpponentDeposit {
  return { type: B_WAIT_FOR_OPPONENT_DEPOSIT, stage: FUNDING, ...channelOpen(params) };
}

export function aWaitForPostFundSetup<T extends ChannelOpen>(params: T): AWaitForPostFundSetup {
  return { type: A_WAIT_FOR_POST_FUND_SETUP, stage: FUNDING, ...channelOpen(params) };
}

export function bWaitForPostFundSetup<T extends ChannelOpen>(params: T): BWaitForPostFundSetup {
  return { type: B_WAIT_FOR_POST_FUND_SETUP, stage: FUNDING, ...channelOpen(params) };
}

export function acknowledgeFundingSuccess<T extends ChannelOpen>(
  params: T,
): AcknowledgeFundingSuccess {
  return { type: ACKNOWLEDGE_FUNDING_SUCCESS, stage: FUNDING, ...channelOpen(params) };
}

export function sendFundingDeclinedMessage<T extends ChannelOpen>(
  params: T,
): SendFundingDeclinedMessage {
  return { type: SEND_FUNDING_DECLINED_MESSAGE, stage: FUNDING, ...channelOpen(params) };
}

export function acknowledgeFundingDeclined<T extends ChannelOpen>(
  params: T,
): AcknowledgeFundingDeclined {
  return { type: ACKNOWLEDGE_FUNDING_DECLINED, stage: FUNDING, ...channelOpen(params) };
}

export type FundingChannelState =
  | WaitForFundingRequest
  | ApproveFunding
  | BWaitForOpponentDeposit
  | AWaitForPostFundSetup
  | BWaitForPostFundSetup
  | AcknowledgeFundingSuccess
  | SendFundingDeclinedMessage
  | AcknowledgeFundingDeclined;

export * from './funding';
export { FundingState } from './funding';
