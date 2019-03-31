interface WaitForApproval {
  channelId: string;
}

interface WaitForStrategyResponse {
  channelId: string;
}

interface WaitForLedgerPreFundSetup1 {
  channelToFund: string;
  ledgerId: string;
}

interface WaitForLedgerDeposit0Submission {
  channelId: string;
  ledgerId: string;
}

interface WaitForLedgerDeposit0Confirmation {
  channelId: string;
  ledgerId: string;
  transactionId: string;
}

interface WaitForLedgerDeposit1Submission {
  channelId: string;
  ledgerId: string;
}

interface WaitForLedgerDeposit1Confirmation {
  channelId: string;
  ledgerId: string;
  transactionId: string;
}

interface WaitForLedgerPostFundSetup1 {
  channelId: string;
  ledgerId: string;
}

interface WaitForLedgerUpdate1 {
  channelId: string;
  ledgerId: string;
}

interface Success {}
