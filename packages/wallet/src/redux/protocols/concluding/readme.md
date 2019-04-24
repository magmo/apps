# Concluding Protocol

The purpose of this protocol is to resign a channel, i.e. to move to a conclude state.
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
  S((Start)) --> E{Channel Exists?}
  E --> |No| F1((Failure))
  E --> |Yes| MT{My turn?}
  MT  --> |Yes| CC(ApproveConcluding)
  MT  --> |No| RC(AcknowledgeConcludingImpossible)
  CC  --> |CANCELLED| F2((Failure))
  CC  --> |CONCLUDE.SENT| WOC(WaitForOpponentConclude)
  WOC --> |CONCLUDE.RECEIVED| ACC(AcknowledgeChannelConcluded)
  ACC --> |DEFUND.CHOSEN| D(WaitForDefund)
  D   --> |DEFUND.SUCCEEDED| SS((Success))
  D   --> |DEFUND.FAILED| F3((Failure))
  RC  --> |CONCLUDING.IMPOSSIBLE.ACKNOWLEDGED| F4((Failure))
  style S  fill:#efdd20
  style E  fill:#efdd20
  style MT fill:#efdd20
  style SS fill:#58ef21
  style F1 fill:#f45941
  style F2 fill:#f45941
  style F3 fill:#f45941
  style F4 fill:#f45941
```

## Scenarios

To test all paths through the state machine we will use 2 different scenarios:

1. **Happy path**: `ApproveConcluding` -> `WaitForOpponentConclude` -> `AcknowledgeChannelConcluded` -> `WaitForDefund` -> `Success`
2. **Channel doesnt exist** `Failure`
3. **Concluding not possible**: `AcknowledgeConcludingImpossible` -> `Failure`
4. **Concluding cancelled** `ApproveConcluding` -> `Failure`
5. **Defund failed** `WaitForDefund` -> `Failure`

# Terminology

Use "Conclude" / "Concluding" everywhere, here. In an application, you might choose to Resign, or you (or an opponent) might run out of funds. In these cases, according to the wallet you are concluding the channel.

For now we will avoid "Resigning", "Closing" and so on.

We will also include the `Defunding` protocol as an optional subprotocol of `Concluding`. If `Defunding` fails, `Concluding` will still be considered to have also failed.
