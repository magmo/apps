// Player B
export interface WaitForStrategy {
  channelId: string;
}

export enum Outcome {
  Success = 'SUCCESS',
  Failure = 'FAILURE',
}
