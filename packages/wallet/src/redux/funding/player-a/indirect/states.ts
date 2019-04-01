interface WaitForLedgerPreFundSetup1 {
  channelToFund: string;
  ledgerId: string;
}

interface WaitForFundingConfirmation {
  channelId: string;
  ledgerId: string;
}

interface WaitForLedgerPostFundSetup1 {
  channelId: string;
  ledgerId: string;
}

interface WaitForLedgerUpdate1 {
  channelId: string;
  ledgerId: string;
}
