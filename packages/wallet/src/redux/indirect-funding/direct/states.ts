import { Strategy } from '../states';

export interface WaitForApproval {
  channelId: string;
  strategy: Strategy.Direct;
}

export interface WaitForFundingConfirmation {
  channelId: string;
}
