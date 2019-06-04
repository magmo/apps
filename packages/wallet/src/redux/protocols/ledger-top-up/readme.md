# Ledger Top Up Protocol

The purpose of the protocol is to top up an existing ledger channel so that it can be used to fund a game.
The protocol has three main steps:

- The protocol exchanges ledger updates that have the additional top-ups at the end of the allocation array.
- The protocol initiates the direct funding protocol to fund the additional top ups
- The protocol exchanges ledger update with simplified allocations

## State machine

```mermaid
graph TD
  linkStyle default interpolate basis
  St((Start))-->NT{Is top up required?}
  NT-->|No|Su((success))
  NT-->|Yes|WFLU(WaitForLedgerUpdate)
  WFLU-->|"CommitmentReceived(Accept)"|WFDF(WaitForDirectFunding)
  WFDF-->|FundingAction|WFDF(WaitForDirectFunding)
  WFDF-->|Success|WFLR(WaitForLedgerReorg)
  WFLU-->|"CommitmentReceived(Reject)"|F((failure))
  WFLR-->|"CommitmentReceived(Reject)"|F((failure))
  WFLR-->|"CommitmentReceived(Accept)"|Su((sucess))
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

1. **Both Players need top-up** Start->WaitForLedgerUpdate->WaitForDirectFunding->WaitForLedgerReorg->Success
2. **Only Player A needs top-up** Start->WaitForLedgerUpdate->WaitForDirectFunding->WaitForLedgerReorg->Success
3. **Only Player B needs top-up** Start->WaitForLedgerUpdate->WaitForDirectFunding->WaitForLedgerReorg->Success
4. **No players need top-up** Start-->Success
5. **Ledger Update Rejected** WaitForLedgerUpdate-->Failure
6. **Ledger Reorg Rejected** WaitForLedgerReorg->Failure
