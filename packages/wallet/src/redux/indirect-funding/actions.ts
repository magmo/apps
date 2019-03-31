import { WalletAction } from '../actions';

export type IndirectFundingAction =
  | StrategyAccepted
  | IndirectFundingRequested
  | StrategyProposed
  | LedgerUpdated
  | TransactionSubmitted;

function isIndirectFundingAction(action: WalletAction): action is IndirectFundingAction {
  const types = ['ledger_updated'];
  return types.indexOf(action.type) > -1;
}

interface IndirectFundingRequested {}
interface StrategyProposed {}
interface StrategyAccepted {}

interface LedgerUpdated {
  type: 'ledger_updated';
  process: 'indirect_funding';
  channelId: string;
}

interface TransactionSubmitted {} // maybe
