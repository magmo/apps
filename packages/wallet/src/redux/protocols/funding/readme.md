# Funding Protocol

The purpose of this protocol is to

1. Determine the funding strategy that will be used to fund a channel
2. Initialize the protocol for the corresponding strategy
3. Route further actions to that strategy's protocol

It should be triggered by the `FUNDING_REQUESTED` event from the app.
On success, it should send `FUNDING_SUCCESS` to the app.

Out of scope (for now):

Supporting protocols other than indirect funding

## State machine

The protocol is implemented with the following state machines

### Player A

```mermaid
graph TD
  S((start)) --> WFSC(WaitForStrategyChoice)

  WFSC --> |StrategyChosen| WFSR(WaitForStrategyResponse)
  WFSR --> |StrategyApproved| WFF(WaitForFunding)
  WFF --> |StrategyAction| WFF
  WFF --> |StrategyAction| WFPFS(WaitForPostFundSetup)

  WFPFS --> |CommitmentReceived| WFSConf(WaitForSuccessConfirmation)
  WFSConf --> |ConfirmSuccess| SS((success))

  WFSR --> |StrategyRejected| WFSC

  WFSC --> |Cancel| F((failure))
  WFSR --> |Cancel| F
```

### Player B

```mermaid
graph TD
  S((start)) --> WFSP(WaitForStrategyProposal)

  WFSP --> |StrategyProposed| WFSA(WaitForStrategyApproved)

  WFSA --> |StrategyApproved| WFF(WaitForFunding)
  WFF --> |StrategyAction| WFF
  WFF --> |StrategyAction| WFPFS(WaitForPostFundSetup)
  WFPFS --> |CommitmentReceived| WFSC(WaitForSuccessConfirmation)

  WFSC --> |ConfirmSuccess| SS((success))

  WFSA --> |StrategyRejected| WFSP

  WFSP --> |Cancel| F((failure))
  WFSA --> |Cancel| F
```
