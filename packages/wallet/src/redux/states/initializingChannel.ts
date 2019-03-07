import { AdjudicatorKnown, adjudicatorKnown } from './shared';

export const INITIALIZING_CHANNEL = 'CHANNEL.INITIALIZING';

export const WAIT_FOR_ADDRESS = 'INITIALIZING_CHANNEL.WAIT_FOR_ADDRESS';
export const METAMASK_LOAD_ERROR = 'METAMASK_LOAD_ERROR';

export interface WaitForAddress extends AdjudicatorKnown {
  type: typeof WAIT_FOR_ADDRESS;
  stage: typeof INITIALIZING_CHANNEL;
}

export function waitForAddress<T extends AdjudicatorKnown>(params: T): WaitForAddress {
  const { outboxState } = params;
  return {
    ...adjudicatorKnown(params),
    type: WAIT_FOR_ADDRESS,
    stage: INITIALIZING_CHANNEL,
    outboxState,
  };
}

export type InitializingChannelState = WaitForAddress;
