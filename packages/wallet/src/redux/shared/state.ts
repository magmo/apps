import { OutboxState } from '../outbox/state';
import { FundingState } from '../fundingState/state';
import { ChannelState } from '../channelState/state';

export interface StateWithSideEffects<T> {
  state: T;
  outboxState?: OutboxState;
}

export interface SharedWalletState {
  channelState: { [channelId: string]: ChannelState };
  fundingState: { [channelId: string]: FundingState };
  outboxState: OutboxState;
}

export const emptyState: SharedWalletState = {
  outboxState: {},
  fundingState: {},
  channelState: {},
};

export interface LoggedIn extends SharedWalletState {
  uid: string;
}

export interface AdjudicatorKnown extends LoggedIn {
  networkId: number;
  adjudicator: string;
}

export interface TransactionExists {
  transactionHash: string;
}

// creators
export function base<T extends SharedWalletState>(params: T): SharedWalletState {
  const { outboxState, channelState, fundingState } = params;
  return { outboxState, channelState, fundingState };
}

export function loggedIn<T extends LoggedIn>(params: T): LoggedIn {
  return { ...base(params), uid: params.uid };
}

export function adjudicatorKnown<T extends AdjudicatorKnown>(params: T): AdjudicatorKnown {
  const { networkId, adjudicator, channelState } = params;
  return { ...loggedIn(params), networkId, adjudicator, channelState };
}
