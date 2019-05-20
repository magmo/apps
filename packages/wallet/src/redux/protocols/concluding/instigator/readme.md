# Concluding Protocol (Instigator)

The purpose of this protocol is to instigate conclusion of a channel, i.e. to move to a conclude state.
It covers:

- Checking to see if it is the player's turn and explaining they can't resign if not
- Asking user to confirm the resignation (probably displaying the current outcome)
- Formulating the conclude state and sending to the opponent
- Waiting for a conclude from the opponent
- Acknowledge channel concluded (giving the option to defund)

Out of scope (for the time being):

- Giving the option to launch a challenge if the conclude doesn't arrive
- Allowing the user to not choose to not defund

## State machine

The protocol is implemented with the following state machine

```mermaid
graph TD
linkStyle default interpolate basis
  S((Start)) --> E{Channel Exists?}
  E --> |No| AF(InstigatorAcknowledgeFailure)
  AF -->|ACKNOWLEDGED| F((Failure))
  E --> |Yes| MT{My turn?}
  MT  --> |Yes| CC(InstigatorApproveConcluding)
  MT  --> |No| AF(InstigatorAcknowledgeFailure)
  CC  --> |CONCLUDING.CANCELLED| F
  CC  --> |CONCLUDE.SENT| WOC(InstigatorWaitForOpponentConclude)
  WOC --> |CONCLUDE.RECEIVED| ACR(InstigatorAcknowledgeConcludeReceived)
  ACR --> |DEFUND.CHOSEN| D(InstigatorWaitForDefund)
  D   --> |defunding protocol succeeded| AS(InstigatorAcknowledgeSuccess)
  AS -->  |ACKNOWLEDGED| SS((Success))
  D   --> |defunding protocol failed| AF(InstigatorAcknowledgeFailure)
  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class S,E,MT logic;
  class SS Success;
  class F Failure;
  class D WaitForChildProtocol;
```

## Scenarios

We will use the following scenarios for testing:

1. **Happy path**: `InstigatorApproveConcluding` -> `InstigatorWaitForOpponentConclude` -> `InstigatorAcknowledgeChannelConcluded` -> `InstigatorWaitForDefund` -> `InstigatorAcknowledgeSuccess` -> `Success`
2. **Channel doesnt exist** `InstigatorAcknowledgeFailure` -> `Failure`
3. **Concluding not possible**: `InstigatorAcknowledgeFailure` -> `Failure`
4. **Concluding cancelled** `InstigatorApproveConcluding` -> `Failure` (note lack of acknowledgement screen)
5. **Defund failed** `InstigatorWaitForDefund` -> `InstigatorAcknowledgeFailure` -> `Failure`

# Terminology

Use "Conclude" / "Concluding" everywhere, here. In an application, you might choose to Resign, or you (or an opponent) might run out of funds. In these cases, according to the wallet you are concluding the channel.

For now we will avoid "Resigning", "Closing" and so on.

We will also include the `Defunding` protocol as an optional subprotocol of `Concluding`. If `Defunding` fails, `Concluding` will still be considered to have also failed.
