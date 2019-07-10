import {
  CommitmentsReceived,
  BaseProcessAction,
  isCommonAction,
  EmbeddedProtocol,
  ProtocolLocator,
} from '../../../communication';
import { WalletAction } from '../../actions';
import { ActionConstructor } from '../../utils';

export interface ClearedToSend extends BaseProcessAction {
  type: 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND';
  protocolLocator: ProtocolLocator;
}

export type AdvanceChannelAction = CommitmentsReceived | ClearedToSend;

export const clearedToSend: ActionConstructor<ClearedToSend> = p => {
  const { processId, protocolLocator } = p;
  return {
    type: 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND',
    processId,
    protocolLocator,
  };
};

export function isAdvanceChannelAction(
  action: WalletAction,
  path = [],
  descriptor = EmbeddedProtocol.AdvanceChannel,
): action is AdvanceChannelAction {
  return (
    isCommonAction(action, path, descriptor) ||
    action.type === 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND'
  );
}
