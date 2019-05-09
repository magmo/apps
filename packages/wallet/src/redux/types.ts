export const enum WalletProtocol {
  Application = 'Application',
  Funding = 'Funding',
  Challenging = 'Challenging',
  ConcludingInstigator = 'ConcludingInstigator',
  ConcludingResponder = 'ConcludingResponder',
  Responding = 'Responding',

  Withdrawing = 'Withdrawing',
  DirectFunding = 'DirectFunding',
  IndirectFunding = 'IndirectFunding',
  TransactionSubmission = 'TransactionSubmission',
  IndirectDefunding = 'IndirectDefunding',
}

export const enum PlayerIndex {
  A = 0,
  B = 1,
}
