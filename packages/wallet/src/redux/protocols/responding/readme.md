# Responding Protocol

The purpose of this protocol is handle responding to a challenge.
It covers:

- Deciding if we can respond to a challenge with commitments that the wallet already has.
- If the response needs a new commitment the response protocol accepting a response commitment.
- Getting confirmation from the user to launch a response.
- Submitting the response transaction to the blockchain.
- Getting acknowledgement from the user before returning to app.

Out of scope (for the time being):

- Handling where the response commitment comes from.
- The respond with alternative move option.

## State machine

```mermaid
graph TD
linkStyle default interpolate basis
  St((start)) --> WFAp(WaitForApproval)
  WFAp--> |Approve| HC{Commitment<br/>exists?}
  HC --> |Yes| WFT(WaitForTransaction)
  HC --> |No| WFR(WaitForResponse)
  WFR -->|ResponseProvided| WFT(WaitForTransaction)
  WFR -->|CHALLENGE_EXPIRED| AT(AcknowledgeTimeOut)
  AT -->|DEFUND_CHOSEN| WFD(WaitForDefund)
  WFD --> |defunding protocol succeeded| AS(AcknowledgeSuccess)
  WFD --> |defunding protocol failed| ACBND(AcknowledgeClosedButNotDefunded)
  WFT --> |TransactionSubmitted| WFAc(WaitForAcknowledgement)
  WFAc-->|Acknowledged| S((success))
  WFT --> |TransactionFailed| F((failure))
  ACBND -->|Acknowledged| FCBND((ClosedButNotDefunded))
  AS -->|Acknowledged| FCD((ClosedAndDefunded))
  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class St,HC logic;
  class S Success;
  class F,FCD,FCBND Failure;
  class WFT,WFD WaitForChildProtocol;
```

Notes:

- On the `Approve` action we determine if we can refute/respond with an existing commitment.
  - If we can we craft and send the transaction. (Transition to `WaitForTransaction`)
  - If we can't we wait for a response to be provided to us.(Transition to `WaitForResponse`)
- Actions will be prefaced by Respond, (ie: `RespondApproved`)

## Test Scenarios

1. Respond With Existing Commitment Happy Path: WaitForApproval->WaitForTransaction->WaitForAcknowledgement->success
2. Refute Happy Path: WaitForApproval->WaitForTransaction->WaitForAcknowledgement->success
3. Select Response Happy Path: WaitForApproval->WaitForResponse->WaitForTransaction->WaitForAcknowledgement->success
4. Transaction fails: WaitForApproval->WaitForTransaction->failure
