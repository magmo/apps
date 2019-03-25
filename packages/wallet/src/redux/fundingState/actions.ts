import * as actions from '../actions';

export const FUNDING_RECEIVED_EVENT = 'FUNDING_RECEIVED_EVENT';
export const fundingReceivedEvent = (
  destination: string,
  amount: string,
  totalForDestination: string,
) => ({
  destination,
  amount,
  totalForDestination,
  type: FUNDING_RECEIVED_EVENT as typeof FUNDING_RECEIVED_EVENT,
});
export type FundingReceivedEvent = ReturnType<typeof fundingReceivedEvent>;

export function isfundingAction(action: actions.WalletAction): action is FundingAction {
  return action.type.match('WALLET.COMMON') ? true : false;
}

// TODO: This is getting large, we should probably split this up into separate types for each stage
export type FundingAction =
  | FundingReceivedEvent
  | actions.internal.InternalAction
  | actions.CommonAction;
