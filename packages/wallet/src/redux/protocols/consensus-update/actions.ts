import { CommitmentReceived, WalletAction } from '../../actions';

export type ConsensusUpdateAction = CommitmentReceived;

export const isConsensusUpdateaction = (action: WalletAction): action is ConsensusUpdateAction => {
  return action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED';
};
