# Channel Sync Protocol

The purpose of this protocol is to synchronize commitments between all players, so all players have the latest commitment.

Each player broadcasts all the commitments they have for a channel. Each player will then update their commitments to the latest valid commitment.

## Out of scope

- Initializing a channel if it does not exist for a player.
- Reconciling alternative commitments. We're going to assume that there are no alternative moves to deal with and the only scenario is where some players are one or more commitments behind another.

```mermaid
graph TD
linkStyle default interpolate basis
  S((start)) --> WFC(WaitForCommitments)
WFC-->|CommitmentReceived|SS((success))
WFC-->|CommitmentReceived|WFC
  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class S logic;
  class SS Success;
  class F Failure;
  class WFF WaitForChildProtocol;
```
