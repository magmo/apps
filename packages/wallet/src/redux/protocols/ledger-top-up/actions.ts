import { WalletAction } from '../../actions';
import { DirectFundingAction } from '../direct-funding';
import { isDirectFundingAction } from '../direct-funding/actions';
import {
  isCommonAction,
  EmbeddedProtocol,
  routerFactory,
  StatesReceived,
} from '../../../communication';

export type LedgerTopUpAction = StatesReceived | DirectFundingAction;

export function isLedgerTopUpAction(action: WalletAction): action is LedgerTopUpAction {
  return isCommonAction(action, EmbeddedProtocol.LedgerTopUp) || isDirectFundingAction(action);
}

export const routesToLedgerTopUp = routerFactory(isLedgerTopUpAction, EmbeddedProtocol.LedgerTopUp);
