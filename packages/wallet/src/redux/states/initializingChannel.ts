import { AdjudicatorKnown, adjudicatorKnown } from './shared';

// stage
export const INITIALIZING_CHANNEL = 'INITIALIZING_CHANNEL';
export const WAIT_FOR_ADDRESS = 'INITIALIZING_CHANNEL.WAIT_FOR_ADDRESS';

export interface WaitForAddress extends AdjudicatorKnown {
  type: typeof WAIT_FOR_ADDRESS;
}

export function waitForAddress<T extends AdjudicatorKnown>(params: T): WaitForAddress {
  const { outboxState } = params;
  return {
    ...adjudicatorKnown(params),
    type: WAIT_FOR_ADDRESS,
    outboxState,
  };
}
export type InitializingChannelState = WaitForAddress;
