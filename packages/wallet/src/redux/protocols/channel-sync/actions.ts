import { WalletAction } from '../../actions';
import { CHANNEL_SYNC_PROTOCOL_LOCATOR } from './reducer';
import { CommitmentsReceived } from '../../../communication';

export type ChannelSyncAction = CommitmentsReceived;

export const isChannelSyncAction = (action: WalletAction): action is ChannelSyncAction => {
  return (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator === CHANNEL_SYNC_PROTOCOL_LOCATOR
  );
};
