import { Strategy } from '../../states';

export interface WaitForApproval {
  channelId: string;
  strategy: Strategy.Indirect;
}

export interface WaitForLedgerPreFundSetup0 {
  channelToFund: string;
  ledgerId: string;
}

export interface WaitForFundingConfirmation {
  channelId: string;
  ledgerId: string;
}

export interface WaitForLedgerPostFundSetup0 {
  channelId: string;
  ledgerId: string;
}

export interface WaitForLedgerUpdate0 {
  channelId: string;
  ledgerId: string;
}
