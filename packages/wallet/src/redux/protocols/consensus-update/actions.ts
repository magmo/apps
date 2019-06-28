import { CommitmentsReceived } from '../../../communication';
import { WalletAction } from '../../actions';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from './reducer';

export type ConsensusUpdateAction = CommitmentsReceived;

export const isConsensusUpdateAction = (action: WalletAction): action is ConsensusUpdateAction => {
  return (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator === CONSENSUS_UPDATE_PROTOCOL_LOCATOR
  );
};
