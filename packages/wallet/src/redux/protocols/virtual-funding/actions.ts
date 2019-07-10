import { WalletAction } from '../../actions';
import { NewLedgerFundingAction, isNewLedgerFundingAction } from '../new-ledger-funding/actions';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';
import { EmbeddedProtocol, ProtocolLocator } from '../../../communication';

export type VirtualFundingAction = NewLedgerFundingAction | AdvanceChannelAction; // | ConsensusReachedAction

export function isVirtualFundingAction(
  action: WalletAction,
  path: ProtocolLocator = [],
  descriptor = EmbeddedProtocol.VirtualFunding,
): action is VirtualFundingAction {
  return (
    isNewLedgerFundingAction(action, path, descriptor) ||
    isAdvanceChannelAction(action, path, descriptor)
  );
}
