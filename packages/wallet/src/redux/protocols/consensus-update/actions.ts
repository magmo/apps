import { WalletAction } from '../../actions';
import {
  CommitmentsReceived,
  BaseProcessAction,
  isCommonAction,
  ProtocolLocator,
  EmbeddedProtocol,
} from '../../../communication';
import { ActionConstructor } from '../../utils';

export interface ClearedToSend extends BaseProcessAction {
  type: 'WALLET.CONSENSUS_UPDATE.CLEARED_TO_SEND';
  protocolLocator: ProtocolLocator;
}

export const clearedToSend: ActionConstructor<ClearedToSend> = p => {
  return {
    ...p,
    type: 'WALLET.CONSENSUS_UPDATE.CLEARED_TO_SEND',
  };
};

export type ConsensusUpdateAction = CommitmentsReceived | ClearedToSend;

export const isConsensusUpdateAction = (
  action: WalletAction,
  path = [],
  descriptor = EmbeddedProtocol.ConsensusUpdate,
): action is ConsensusUpdateAction => {
  return (
    isCommonAction(action, path, descriptor) ||
    action.type === 'WALLET.CONSENSUS_UPDATE.CLEARED_TO_SEND'
  );
};
