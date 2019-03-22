import {
  ChallengeExists,
  challengeExists,
  ChannelOpen,
  channelOpen,
  TypedChannelState,
} from '../../shared/state';
import { TransactionExists } from '../../../shared/state';
export const CHALLENGING = 'CHALLENGING';

export const APPROVE_CHALLENGE = 'APPROVE_CHALLENGE';
export const WAIT_FOR_CHALLENGE_INITIATION = 'INITIATE_CHALLENGE';
export const WAIT_FOR_CHALLENGE_SUBMISSION = 'WAIT_FOR_CHALLENGE_SUBMISSION';
export const WAIT_FOR_CHALLENGE_CONFIRMATION = 'WAIT_FOR_CHALLENGE_CONFIRMATION';

export const WAIT_FOR_RESPONSE_OR_TIMEOUT = 'WAIT_FOR_RESPONSE_OR_TIMEOUT';
export const ACKNOWLEDGE_CHALLENGE_RESPONSE = 'ACKNOWLEDGE_CHALLENGE_RESPONSE';
export const ACKNOWLEDGE_CHALLENGE_TIMEOUT = 'ACKNOWLEDGE_CHALLENGE_TIMEOUT';
export const CHALLENGE_TRANSACTION_FAILED = 'CHALLENGE_TRANSACTION_FAILED';

export interface ChallengeTransactionFailed extends ChannelOpen, TypedChannelState {
  type: typeof CHALLENGE_TRANSACTION_FAILED;
  stage: typeof CHALLENGING;
}

export function challengeTransactionFailed<T extends ChannelOpen>(
  params: T,
): ChallengeTransactionFailed {
  return {
    type: CHALLENGE_TRANSACTION_FAILED,
    stage: CHALLENGING,
    ...channelOpen(params),
    channelType: 'Application',
  };
}

export interface ApproveChallenge extends ChannelOpen, TypedChannelState {
  type: typeof APPROVE_CHALLENGE;
  stage: typeof CHALLENGING;
}

export function approveChallenge<T extends ChannelOpen>(params: T): ApproveChallenge {
  return {
    type: APPROVE_CHALLENGE,
    stage: CHALLENGING,
    ...channelOpen(params),
    channelType: 'Application',
  };
}

export interface WaitForChallengeInitiation extends ChannelOpen, TypedChannelState {
  type: typeof WAIT_FOR_CHALLENGE_INITIATION;
  stage: typeof CHALLENGING;
}
export function waitForChallengeInitiation<T extends ChannelOpen>(
  params: T,
): WaitForChallengeInitiation {
  return {
    type: WAIT_FOR_CHALLENGE_INITIATION,
    stage: CHALLENGING,
    ...channelOpen(params),
    channelType: 'Application',
  };
}

export interface WaitForChallengeSubmission extends ChannelOpen, TypedChannelState {
  type: typeof WAIT_FOR_CHALLENGE_SUBMISSION;
  stage: typeof CHALLENGING;
}
export function waitForChallengeSubmission<T extends ChannelOpen>(
  params: T,
): WaitForChallengeSubmission {
  return {
    type: WAIT_FOR_CHALLENGE_SUBMISSION,
    stage: CHALLENGING,
    ...channelOpen(params),
    channelType: 'Application',
  };
}

export interface WaitForChallengeConfirmation
  extends ChallengeExists,
    TransactionExists,
    TypedChannelState {
  type: typeof WAIT_FOR_CHALLENGE_CONFIRMATION;
  stage: typeof CHALLENGING;
}
export function waitForChallengeConfirmation<T extends ChallengeExists & TransactionExists>(
  params: T,
): WaitForChallengeConfirmation {
  return {
    type: WAIT_FOR_CHALLENGE_CONFIRMATION,
    stage: CHALLENGING,
    ...challengeExists(params),
    transactionHash: params.transactionHash,
    channelType: 'Application',
  };
}

export interface WaitForResponseOrTimeout extends ChallengeExists, TypedChannelState {
  type: typeof WAIT_FOR_RESPONSE_OR_TIMEOUT;
  stage: typeof CHALLENGING;
}

export function waitForResponseOrTimeout<T extends ChallengeExists>(
  params: T,
): WaitForResponseOrTimeout {
  return {
    type: WAIT_FOR_RESPONSE_OR_TIMEOUT,
    stage: CHALLENGING,
    ...challengeExists(params),
    channelType: 'Application',
  };
}

export interface AcknowledgeChallengeResponse extends ChallengeExists, TypedChannelState {
  type: typeof ACKNOWLEDGE_CHALLENGE_RESPONSE;
  stage: typeof CHALLENGING;
}

export function acknowledgeChallengeResponse<T extends ChallengeExists>(
  params: T,
): AcknowledgeChallengeResponse {
  return {
    type: ACKNOWLEDGE_CHALLENGE_RESPONSE,
    stage: CHALLENGING,
    ...challengeExists(params),
    channelType: 'Application',
  };
}

export interface AcknowledgeChallengeTimeout extends ChallengeExists, TypedChannelState {
  type: typeof ACKNOWLEDGE_CHALLENGE_TIMEOUT;
  stage: typeof CHALLENGING;
}

export function acknowledgeChallengeTimeout<T extends ChallengeExists>(
  params: T,
): AcknowledgeChallengeTimeout {
  return {
    type: ACKNOWLEDGE_CHALLENGE_TIMEOUT,
    stage: CHALLENGING,
    ...challengeExists(params),
    channelType: 'Application',
  };
}

export type ChallengingState =
  | WaitForChallengeInitiation
  | WaitForChallengeSubmission
  | WaitForChallengeConfirmation
  | WaitForResponseOrTimeout
  | AcknowledgeChallengeResponse
  | AcknowledgeChallengeTimeout
  | ApproveChallenge
  | ChallengeTransactionFailed;
