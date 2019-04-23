# Resignation Protocol

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
  CR  --> |Yes| CC(ApproveResignation)
  CR  --> |No| RC(AcknowledgeResignationImpossible)
  CC  --> |CANCEL| F2((failure))
  CC  --> |CONCLUDE.SENT| WOC(WaitForOpponentConclude)
  WOC --> |CONCLUDE.RECEIVED| ACC(AcknowledgeChannelClosed)
  ACC --> |DEFUND.CHOSEN| D(WaitForDefund)
  D   --> |DEFUND.SUCCEEDED| SS((success))
  D   --> |DEFUND.FAILED| F3((failure))
  RC  --> |RESIGNATION.IMPOSSIBLE.ACKNOWLEDGED| F4((failure))
```

## Scenarios

To test all paths through the state machine we will use 3 different scenarios:

1. **Happy path**: `ApproveResignation` -> `WaitForOpponentConclude` -> `AcknowledgeChannelClosed` -> `WaitForDefund` -> `Success`
2. **Resignation not possible**: `AcknowledgeResignationImpossible` -> `Failure`
3. **Closed but not defunded**: `AcknowledgeChannelClosed` -> `Success`

