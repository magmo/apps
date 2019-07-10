import { WalletAction } from '../../actions';
import { NewLedgerFundingAction, isNewLedgerFundingAction } from '../new-ledger-funding/actions';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';
import { VIRTUAL_FUNDING_PROTOCOL_LOCATOR } from './reducer';

export type VirtualFundingAction = NewLedgerFundingAction | AdvanceChannelAction; // | ConsensusReachedAction

export function isVirtualFundingAction(
  action: WalletAction,
  path = '',
  descriptor = VIRTUAL_FUNDING_PROTOCOL_LOCATOR,
): action is VirtualFundingAction {
  return (
    isNewLedgerFundingAction(action, path, descriptor) ||
    isAdvanceChannelAction(action, path, descriptor)
  );
}
