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
graph LR
  St((start)) --> WFR(WaitForResponse)
  St((start)) --> WFAp(WaitForApproval)
  WFR -->|ResponseSelected| WFAp(WaitForApproval)
  WFAp-->|Rejected|F((failure))
  WFAp --> |Approved|WFT(WaitForTransaction)
  WFT --> |TransactionSubmitted| WFAc(WaitForAcknowledgement)
  WFAc-->|Acknowledged|S((success))
  WFT --> |TransactionFailed| F((failure))
```

Notes:

- The protocols initialize function determines if it can provide a response with the existing commitments the wallet knows about or if we need an external response.
