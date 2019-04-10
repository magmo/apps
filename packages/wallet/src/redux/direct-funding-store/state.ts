export interface DirectFundingStore {
  [channelId: string]: states.DirectFundingState;
}

import * as states from '../direct-funding/state';

export { states };
