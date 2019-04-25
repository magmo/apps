import * as actions from '../../actions';

export function isDirectFundingAction(action: actions.WalletAction): action is FundingAction {
  return (
    action.type === 'WALLET.COMMON.COMMITMENT_RECEIVED' ||
    action.type === 'WALLET.ADJUDICATOR.FUNDING_RECEIVED_EVENT' ||
    actions.internal.isFundingAction(action) ||
    actions.isTransactionAction(action)
  );
}

export type FundingAction =
  | actions.CommitmentReceived
  | actions.FundingReceivedEvent
  | actions.internal.InternalFundingAction
  | actions.TransactionAction;
