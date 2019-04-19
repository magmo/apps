# Indirect Funding Protocol for Player B

### State Machine

```mermaid
  graph TD
  linkStyle default interpolate basis
    WFPrF0(WaitForPreFundL0) -->|ReceiveCommitment| WFDF(WaitForDirectFunding)
    WFDF -->|FundingAction| WFDF
    WFDF -->|Success| WFLU0(WaitForLedgerUpdate0)
    WFDF -->|Failure| F((Failure))
    WFLU0 --> |ReceiveCommitment| WFPoF0(WaitForPostFund0)
    WFPoF0 --> |ReceiveCommitment| S((Success))
```

### Scenarios

We will use the following two scenarios in tests:

1. **Happy path**: `WaitForPreFundL0` -> `WaitForDirectFunding` -> `WaitForLedgerUpdate0` -> `WaitForPostFund0` -> `Success`
2. **Ledger funding fails**: `WaitForDirectFunding` -> `Failure`
