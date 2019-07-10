import * as actions from '../../actions';
import { ActionConstructor } from '../../utils';
import { TwoPartyPlayerIndex } from '../../types';
import { DIRECT_FUNDING_PROTOCOL_LOCATOR } from './reducer';
import { isCommonAction } from '../../../communication';

// -------
// Actions
// -------
export interface DirectFundingRequested {
  type: 'WALLET.DIRECT_FUNDING.DIRECT_FUNDING_REQUESTED';
  processId: string;
  channelId: string;
  totalFundingRequired: string;
  safeToDepositLevel: string;
  requiredDeposit: string;
  ourIndex: TwoPartyPlayerIndex;
  exchangePostFundSetups: boolean;
}

// -------
// Constructors
// -------
export const directFundingRequested: ActionConstructor<DirectFundingRequested> = p => ({
  ...p,
  type: 'WALLET.DIRECT_FUNDING.DIRECT_FUNDING_REQUESTED',
});
// -------
// Unions and Guards
// -------

export type DirectFundingAction =
  | DirectFundingRequested
  | actions.CommitmentReceived
  | actions.FundingReceivedEvent
  | actions.advanceChannel.AdvanceChannelAction
  | actions.TransactionAction;

export function isDirectFundingAction(
  action: actions.WalletAction,
  path = '',
  descriptor = DIRECT_FUNDING_PROTOCOL_LOCATOR,
): action is DirectFundingAction {
  return (
    action.type === 'WALLET.ADJUDICATOR.FUNDING_RECEIVED_EVENT' ||
    action.type === 'WALLET.DIRECT_FUNDING.DIRECT_FUNDING_REQUESTED' ||
    isCommonAction(action, path, descriptor) ||
    actions.advanceChannel.isAdvanceChannelAction(action) ||
    actions.isTransactionAction(action)
  );
}
