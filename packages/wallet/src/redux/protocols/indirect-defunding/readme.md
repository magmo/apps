# Indirect De-Funding Protocol

The purpose of this protocol is handle de-funding a channel that has been indirectly funded.

It covers:

- Checking that a channel is closed (either finalized on chain or a conclusion proof exists)
- Crafting a ledger update that allocates the funds to the players.
- Waiting for a ledger response from the opponent.

## State machine

### Player A State machine

```mermaid
graph TD
linkStyle default interpolate basis
  St((start))-->DF{Defundable?}
  DF --> |No| F((Failure))
  DF -->|Yes|SC0[SendLedgerUpdate]
  SC0-->WFU(WaitForLedgerUpdate)
  WFU --> |"CommitmentReceived(Accept)"|Su[Success]
  WFU --> |"CommitmentReceived(Reject)"| F

  style St  fill:#efdd20
  style DF  fill:#efdd20
  style Su fill:#58ef21
  style F  fill:#f45941
```

### Player B State machine

```mermaid
graph TD
linkStyle default interpolate basis
  St((start))-->DF{Defundable?}
  DF --> |No| F((Failure))
  DF --> |Yes| WFU(WaitForLedgerUpdate)
  WFU-->|"CommitmentReceived(Accept)"|SC1[SendLedgerUpdate1]
  WFU --> |"CommitmentReceived(Reject)"| F
  SC1-->S((success))

  style St  fill:#efdd20
  style DF  fill:#efdd20
  style S fill:#58ef21
  style F  fill:#f45941

```

Notes:

- SendLedgerUpdate is not a state but indicate when the ledger update is sent.
- A single reducer implements both the player A and B state machine.

## Scenarios

1. **Happy Path - Player A** Start->SendLedgerUpdate->WaitForLedgerUpdate->Success
2. **Happy Path - Player B** Start->WaitForLedgerUpdate->SendLedgerUpdate->Success
3. **Not De-fundable** Start->Failure
4. **Commitment Rejected - Player A** Start->SendLedgerUpdate->WaitForLedgerUpdate->Failure
5. **Commitment Rejected - Player B** Start->WaitForLedgerUpdate->Failure
