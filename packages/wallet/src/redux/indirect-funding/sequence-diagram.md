# Indirect funding sequence diagram

## Overview

The sequence diagram shows the interaction between `player A`, `player B` and the adjudicator/blockchain. The diagram does not attempt to describe internal events for either of the players or the adjudicator.

## Starting state

We assume that the application is responsible for driving the application channel to the point where the channel is ready for funding.

## Terminology

Below, we refer to the application channel as `X`. We refer to the ledger channel funding the application channel as `L`. `Player A` is the first player, or, in other words, the player who initiated opening the application channel. A `proccess` is a coordinated sequence of actions that achieves a high-level channel goal like indirectly funding a channel, topping up of a channel, etc.

## Diagram

For the diagram below, every exchanged message between `player A` and `player B` also contains the following key-value pairs:

1.  `process: indirect_funding`
2.  `channelId: X`

```mermaid
sequenceDiagram
  participant A as A's wallet
  participant B as B's wallet
  participant adj as Adjudicator

  Note over A, B: Agree on indirect funding
  A->>B: type: funding_proposed
  B->>A: type: funding_approved
  Note  over A, B: Open and fund L
  A->>B: type: ledger_prefund, commitment: C1
  B->>A: type: ledger_prefund, commitment: C2
  A->>adj: deposit to L
  A->>B: type: deposit_transaction, transaction_id: T1
  adj->>A: funding changed for L
  adj->>B: funding changed for L
  B->>adj: deposit to L
  B->>A: type: deposit_transaction, transaction_id: T2
  adj->>A: funding changed for L
  adj->>B: funding changed for L
  A->>B: type: ledger_postfund, commitment: C3
  B->>A: type: ledger_postfund, commitment: C4
  Note  over A, B: use L to fund X
  A->>B: type: allocate_ledger_to_application, commitment: C4
  B->>A: type: allocate_ledger_to_application, commitment: C5
  Note  over A, B: Finish indirect funding
  A->>B: type: application_postfund, commitment: C6
  B->>A: type: application_postfund, commitment: C7
```
