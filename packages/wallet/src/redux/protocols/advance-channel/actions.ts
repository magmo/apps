import { CommitmentsReceived, BaseProcessAction, isCommonAction } from '../../../communication';
import { WalletAction } from '../../actions';
import { ActionConstructor } from '../../utils';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from './reducer';

export interface ClearedToSend extends BaseProcessAction {
  type: 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND';
  protocolLocator: string;
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
  path = '',
  descriptor = ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
): action is AdvanceChannelAction {
  return (
    isCommonAction(action, path, descriptor) ||
    action.type === 'WALLET.ADVANCE_CHANNEL.CLEARED_TO_SEND'
  );
}
