# Concluding Protocol

The purpose of this protocol is to resign a channel, i.e. to move to a conclude state.
It covers:

- Checking to see if it is the player's turn and explaining they can't resign if not
- Asking user to confirm the resignation (probably displaying the current outcome)
- Formulating the conclude state and sending to the opponent
- Waiting for a conclude from the opponent
- Acknowledge channel closed (giving the option to defund)

Out of scope (for the time being):

- Giving the option to launch a challenge if the conclude doesn't arrive

## State machine

The protocol is implemented with the following state machine

```mermaid
graph TD
  S((start)) --> E{Channel Exists?}
  E --> |No| F1((failure))
  E --> |Yes| CR{My turn?}
  CR  --> |Yes| CC(ApproveConcluding)
  CR  --> |No| RC(AcknowledgeConcludingImpossible)
  CC  --> |CANCEL| F2((failure))
  CC  --> |CONCLUDE.SENT| WOC(WaitForOpponentConclude)
  WOC --> |CONCLUDE.RECEIVED| ACC(AcknowledgeChannelConcluded)
  ACC --> |DEFUND.CHOSEN| D(WaitForDefund)
  D   --> |DEFUND.SUCCEEDED| SS((success))
  D   --> |DEFUND.FAILED| F3((failure))
  RC  --> |CONCLUDING.IMPOSSIBLE.ACKNOWLEDGED| F4((failure))
```

## Scenarios

To test all paths through the state machine we will use 3 different scenarios:

1. **Happy path**: `ApproveConcluding` -> `WaitForOpponentConclude` -> `AcknowledgeChannelConcluded` -> `WaitForDefund` -> `Success`
2. **Concluding not possible**: `AcknowledgeConcludingImpossible` -> `Failure`
3. **Closed but not defunded**: `AcknowledgeChannelConcluded` -> `Success`

# Terminology
Use "Conclude" / "Concluding" everywhere, here. In an application, you might choose to Resign, or you (or an opponent) might run out of funds. In these cases, according to the wallet you are concluding the channel. 

For now we will avoid "Resigning", "Closing" and so on. 

We will also include the `Defunding` protocol as an optional subprotocol of `Concluding`. If `Defunding` fails, `Concluding` will still be considered successful. 

