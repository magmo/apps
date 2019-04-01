export interface WaitForApproval {
  channelId: string;
}

export interface WaitForStrategyResponse {
  channelId: string;
}

export enum Outcome {
  Success = 'SUCCESS',
  Failure = 'FAILURE',
}
