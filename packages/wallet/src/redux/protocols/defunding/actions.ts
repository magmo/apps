import { WithdrawalAction } from '../withdrawing/actions';
// TODO: Replace once ledger defunding actions are defined
type LedgerDefundingAction = any;
export type DefundingAction = WithdrawalAction | LedgerDefundingAction;
