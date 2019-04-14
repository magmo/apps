import { TransactionSubmissionState } from '../transaction-submission';

export type ChallengingState =
  | WaitForApproval
  | WaitForTransaction
  | WaitForResponseOrTimeout
  | AcknowledgeTimeout
  | AcknowledgeResponse
  | Unnecessary
  | SuccessOpen
  | SuccessClosed
  | Failure;

export interface WaitForApproval {
  type: 'WaitForApproval';
  processId: string;
  channelId: string;
}

export interface WaitForTransaction {
  type: 'WaitForTransaction';
  processId: string;
  channelId: string;
  transactionSubmissionState: TransactionSubmissionState;
}

export interface WaitForResponseOrTimeout {
  type: 'WaitForResponseOrTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeTimeout {
  type: 'AcknowledgeTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeUnneccessary {
  type: 'AcknowledgeTimeout';
  processId: string;
  channelId: string;
}

export interface AcknowledgeResponse {
  type: 'AcknowledgeResponse';
  processId: string;
  channelId: string;
}

export interface Failure {
  type: 'Failure';
}

export interface Unnecessary {
  type: 'Unnecessary';
}

export interface SuccessOpen {
  type: 'SuccessOpen';
}

export interface SuccessClosed {
  type: 'SuccessClosed';
}
