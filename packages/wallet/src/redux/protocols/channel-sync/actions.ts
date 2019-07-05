import { WalletAction } from '../../actions';
import {
  CommitmentsReceived,
  isCommonAction,
  EmbeddedProtocol,
  routerFactory,
} from '../../../communication';

export type ChannelSyncAction = CommitmentsReceived;

export const isChannelSyncAction = (action: WalletAction): action is ChannelSyncAction => {
  return isCommonAction(action, EmbeddedProtocol.ChannelSync);
};

export const routesToChannelSync = routerFactory(
  isChannelSyncAction,
  EmbeddedProtocol.ExistingLedgerFunding,
);
