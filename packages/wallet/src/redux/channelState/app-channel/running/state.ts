import { ChannelOpen, channelOpen, TypedChannelState } from '../../shared/state';

// stage
export const RUNNING = 'RUNNING';

export const WAIT_FOR_UPDATE = 'WAIT_FOR_UPDATE';

export interface WaitForUpdate extends ChannelOpen, TypedChannelState {
  type: typeof WAIT_FOR_UPDATE;
  stage: typeof RUNNING;
}

export function waitForUpdate<T extends ChannelOpen>(params: T): WaitForUpdate {
  return {
    type: WAIT_FOR_UPDATE,
    stage: RUNNING,
    channelType: 'Application',
    ...channelOpen(params),
  };
}

export type RunningState = WaitForUpdate;
