import * as actions from '../actions';

export const FUNDING_RECEIVED_EVENT = 'WALLET.FUNDING.FUNDING_RECEIVED_EVENT';
export const fundingReceivedEvent = (
  channelId: string,
  amount: string,
  totalForDestination: string,
) => ({
  channelId,
  amount,
  totalForDestination,
  type: FUNDING_RECEIVED_EVENT as typeof FUNDING_RECEIVED_EVENT,
});
export type FundingReceivedEvent = ReturnType<typeof fundingReceivedEvent>;

export function isfundingAction(action: actions.WalletAction): action is FundingAction {
  return action.type.match('WALLET.FUNDING') ||
    actions.internal.isFundingAction(action) ||
    actions.isCommonAction(action)
    ? true
    : false;
}

// TODO: This is getting large, we should probably split this up into separate types for each stage
export type FundingAction =
  | FundingReceivedEvent
  | actions.internal.InternalFundingAction
  | actions.CommonAction;
