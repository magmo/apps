import { CommitmentReceived, WalletAction } from '../../actions';

export type ExistingChannelFundingAction = CommitmentReceived;

export function isExistingChannelFundingAction(
  action: WalletAction,
): action is ExistingChannelFundingAction {
  return action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED';
}
