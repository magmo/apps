import { ActionConstructor } from '../../utils';
import { WalletAction } from '../../actions';

export interface CloseChannelManagement {
  type: 'WALLET.CHANNEL_MANAGEMENT.CLOSE_CHANNEL_MANAGEMENT';
  processId: string;
}

export const closeChannelManagement: ActionConstructor<CloseChannelManagement> = p => {
  return { ...p, type: 'WALLET.CHANNEL_MANAGEMENT.CLOSE_CHANNEL_MANAGEMENT' };
};

export type ChannelManagementAction = CloseChannelManagement;

export const isChannelManagementAction = (
  action: WalletAction,
): action is ChannelManagementAction => {
  return action.type === 'WALLET.CHANNEL_MANAGEMENT.CLOSE_CHANNEL_MANAGEMENT';
};
