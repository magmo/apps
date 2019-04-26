import { Commitment } from '../../domain';
import * as walletActions from '../actions';

export const CREATE_CHANNEL_REQUEST = ''; // send over opponent addresses, gameLibrary
// return nonce etc.
export const JOIN_CHANNEL_REQUEST = '';
export const ADDRESS_REQUEST = ''; // provide me with an address

export const OWN_COMMITMENT_RECEIVED = 'WALLET.CHANNEL.OWN_COMMITMENT_RECEIVED';
export const ownCommitmentReceived = (commitment: Commitment) => ({
  type: OWN_COMMITMENT_RECEIVED as typeof OWN_COMMITMENT_RECEIVED,
  commitment,
});
export type OwnCommitmentReceived = ReturnType<typeof ownCommitmentReceived>;

export const CHALLENGE_COMMITMENT_RECEIVED = 'WALLET.CHANNEL.CHALLENGE_COMMITMENT_RECEIVED';
export const challengeCommitmentReceived = (commitment: Commitment) => ({
  type: CHALLENGE_COMMITMENT_RECEIVED as typeof CHALLENGE_COMMITMENT_RECEIVED,
  commitment,
});
export type ChallengeCommitmentReceived = ReturnType<typeof challengeCommitmentReceived>;

export const OPPONENT_COMMITMENT_RECEIVED = 'WALLET.CHANNEL.OPPONENT_COMMITMENT_RECEIVED';
export const opponentCommitmentReceived = (commitment: Commitment, signature: string) => ({
  type: OPPONENT_COMMITMENT_RECEIVED as typeof OPPONENT_COMMITMENT_RECEIVED,
  commitment,
  signature,
});
export type OpponentCommitmentReceived = ReturnType<typeof opponentCommitmentReceived>;

export const POST_FUND_SETUP_RECEIVED = 'WALLET.CHANNEL.POST_FUND_SETUP_RECEIVED'; // when X blocks deep
export const postFundSetupReceived = (data: string, signature: string) => ({
  type: POST_FUND_SETUP_RECEIVED as typeof POST_FUND_SETUP_RECEIVED,
  data,
  signature,
});
export type PostFundSetupReceived = ReturnType<typeof postFundSetupReceived>;

export const CONCLUDE_REQUESTED = 'WALLET.CHANNEL.CONCLUDE_REQUESTED';
export const concludeRequested = () => ({
  type: CONCLUDE_REQUESTED as typeof CONCLUDE_REQUESTED,
});
export type ConcludeRequested = ReturnType<typeof concludeRequested>;

export const CONCLUDE_APPROVED = 'WALLET.CHANNEL.CONCLUDE_APPROVED';
export const concludeApproved = () => ({
  type: CONCLUDE_APPROVED as typeof CONCLUDE_APPROVED,
});
export type ConcludeApproved = ReturnType<typeof concludeApproved>;

export const CONCLUDE_REJECTED = 'WALLET.CHANNEL.CONCLUDE_REJECTED';
export const concludeRejected = () => ({
  type: CONCLUDE_REJECTED as typeof CONCLUDE_REJECTED,
});
export type ConcludeRejected = ReturnType<typeof concludeRejected>;

export const CLOSE_SUCCESS_ACKNOWLEDGED = 'WALLET.CHANNEL.CLOSE_SUCCESS_ACKNOWLEDGED';
export const closeSuccessAcknowledged = () => ({
  type: CLOSE_SUCCESS_ACKNOWLEDGED as typeof CLOSE_SUCCESS_ACKNOWLEDGED,
});
export type CloseSuccessAcknowledged = ReturnType<typeof closeSuccessAcknowledged>;

export const CLOSED_ON_CHAIN_ACKNOWLEDGED = 'WALLET.CHANNEL.CLOSED_ON_CHAIN_ACKNOWLEDGED';
export const closedOnChainAcknowledged = () => ({
  type: CLOSED_ON_CHAIN_ACKNOWLEDGED as typeof CLOSED_ON_CHAIN_ACKNOWLEDGED,
});
export type ClosedOnChainAcknowledged = ReturnType<typeof closedOnChainAcknowledged>;

export const APPROVE_CLOSE = 'WALLET.CHANNEL.APPROVE_CLOSE';
export const approveClose = (withdrawAddress: string) => ({
  type: APPROVE_CLOSE as typeof APPROVE_CLOSE,
  withdrawAddress,
});
export type ApproveClose = ReturnType<typeof approveClose>;

export type ChannelAction =  // TODO: Some of these actions probably also belong in a FundingAction type
  | ApproveClose
  | ClosedOnChainAcknowledged
  | CloseSuccessAcknowledged
  | ConcludeApproved
  | ConcludeRejected
  | ConcludeRequested
  | OpponentCommitmentReceived
  | OwnCommitmentReceived
  | PostFundSetupReceived
  | walletActions.CommonAction
  | walletActions.internal.InternalChannelAction;

export const isReceiveFirstCommitment = (
  action: walletActions.WalletAction,
): action is OwnCommitmentReceived | OpponentCommitmentReceived => {
  return 'commitment' in action && action.commitment.turnNum === 0;
};
