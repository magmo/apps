# Challenging Protocol

This protocol handles launching a challenge on the blockchain. It includes:

- Getting confirmation from the user to launch the challenge.
- Submitting the challenge transaction to the blockchain.
- Monitoring the blockchain for a response or timeout.

Out of scope (for now)

- Halting the challenge in the case where the opponents move arrives between approval and transaction submission.
- Chain reorgs (e.g. timeout on one fork vs. response on another)

## State machine

The protocol is implemented with the following state machine

```mermaid
graph TD
  S((start)) --> WFA(WaitForApproval)
  WFA --> |ChallengeApproved| MT{MyTurn}
  MT --> |No| WFT(WaitForTransaction)
  MT --> |Yes| AU(AcknowledgeUnnecessary)
  AU --> |ChallengeUneccessaryAcknowledged| SU((Unnecessary))
  WFA --> |ChallengeDenied| AF(AcknowledgeFailure)
  AF --> |FailureAcknowledged| F((Failure))
  WFT --> |TransactionSuccess| WFRT(WaitForResponseOrTimeout)
  WFT --> |TransactionFailure| AF
  WFRT --> |BlockMined??| AT(AcknowledgeTimeout)
  AT --> |TimeoutAcknowledged| SC((Closed))
  WFRT --> |ChallengeResponseReceived| AR(AcknowledgeResponse)
  AR --> |ResponseAcknowledged| SP((Open))
```

Note:

- We don't currently give the option to retry in the case that the transaction fails.
- The `MyTurn` check is performed after approval, just in case the opponent's move has arrived in the meantime.

## Scenarios

To test all paths through the state machine we will use 5 different scenarios:

1. **Opponent responds**: `WaitForApproval` -> `WaitForTransaction` -> `WaitForResponseOrTimeout`
   -> `AcknowledgeResponse` -> `Open`
2. **Challenge times out**: `WaitForResponseOrTimeout` -> `AcknowledgeTimeout` -> `Closed`
3. **Challenge unnecessary**: `WaitForApproval` -> `AcknowledgeUnnecessary` -> `Unnecessary`
4. **User denies challenge**: `WaitForApproval` -> `AcknowledgeFailure` -> `Failure`
5. **Transaction fails**: `WaitForTransaction` -> `AcknowledgeFailure` -> `Failure`
