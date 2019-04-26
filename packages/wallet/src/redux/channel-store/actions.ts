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

export const OPPONENT_COMMITMENT_RECEIVED = 'WALLET.CHANNEL.OPPONENT_COMMITMENT_RECEIVED';
export const opponentCommitmentReceived = (commitment: Commitment, signature: string) => ({
  type: OPPONENT_COMMITMENT_RECEIVED as typeof OPPONENT_COMMITMENT_RECEIVED,
  commitment,
  signature,
});
export type OpponentCommitmentReceived = ReturnType<typeof opponentCommitmentReceived>;

export type ChannelAction =  // TODO: Some of these actions probably also belong in a FundingAction type
  | OpponentCommitmentReceived
  | OwnCommitmentReceived
  | walletActions.CommonAction
  | walletActions.internal.InternalChannelAction;

export const isReceiveFirstCommitment = (
  action: walletActions.WalletAction,
): action is OwnCommitmentReceived | OpponentCommitmentReceived => {
  return 'commitment' in action && action.commitment.turnNum === 0;
};
