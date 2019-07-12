import { WalletAction } from '../../actions';
import { isCommonAction, EmbeddedProtocol, routerFactory } from '../../../communication';
import { isDirectFundingAction, DirectFundingAction } from '../direct-funding/actions';
import { ConsensusUpdateAction, isConsensusUpdateAction } from '../consensus-update';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';

// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export type NewLedgerFundingAction =
  | ConsensusUpdateAction
  | AdvanceChannelAction
  | DirectFundingAction;
export function isNewLedgerFundingAction(action: WalletAction): action is NewLedgerFundingAction {
  return (
    isCommonAction(action, EmbeddedProtocol.NewLedgerFunding) ||
    isDirectFundingAction(action) ||
    isConsensusUpdateAction(action) ||
    isAdvanceChannelAction(action)
  );
}

export const routesToNewLedgerFunding = routerFactory(
  isNewLedgerFundingAction,
  EmbeddedProtocol.NewLedgerFunding,
);
