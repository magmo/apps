# Ledger Top Up Protocol

The purpose of the protocol is to top up an existing ledger channel so that it can be used to fund a game.

## State machine

```mermaid
graph TD
  linkStyle default interpolate basis
  St((Start))-->ANT{Does Player A require top-up?}
  ANT-->|No|BNT{Does Player B require top-up}
  ANT-->|Yes|WFLUA(WaitForLedgerUpdateForPlayerA)
  WFLUA-->|"CommitmentReceived(Accept)"|WFDFA(WaitForDirectFunding)
  WFDFA-->|FundingAction|WFDFA(WaitForDirectFunding)
  WFDFA-->|Success|BNT
  WFLUA-->|"CommitmentReceived(Reject)"|F((failure))
  BNT-->|No|Su((success))
  BNT-->|Yes|WFLUB(WaitForLedgerUpdateForPlayerB)
  WFLUB-->|"CommitmentReceived(Accept)"|WFDFB(WaitForDirectFunding)
  WFDFB-->|FundingAction|WFDFB(WaitForDirectFunding)
  WFDFB-->|Success|Su((sucess))
    WFLUB-->|"CommitmentReceived(Reject)"|F((failure))

  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class St,NT logic;
  class Su Success;
  class F Failure;
  class LT WaitForChildProtocol;
```

## Scenarios

1. **Both Players need top-up** Start->WaitForLedgerUpdatePlayerA->WaitForDirectFunding->WaitForLedgerUpdatePlayerB-->WaitForDirectFunding->Success
2. **Only Player A needs top-up** Start->WaitForLedgerUpdatePlayerA->WaitForDirectFunding->Success
3. **Only Player B needs top-up** Start->WaitForLedgerUpdatePlayerB->WaitForDirectFunding->Success
4. **No players need top-up** Start-->Success
5. **Player A Ledger Update Rejected** WaitForLedgerUpdatePlayerA-->Failure
6. **Player B Ledger Reorg Rejected** WaitForLedgerUpdatePlayerB->Failure
