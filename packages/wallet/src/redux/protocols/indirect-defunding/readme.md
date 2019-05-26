# Indirect De-Funding Protocol

The purpose of this protocol is handle de-funding a channel that has been indirectly funded.

The protocol exchanges updates to allocate funds back to the player and conclude commitments to close the channel.

It covers:

- Checking that a channel is closed (either finalized on chain or a conclusion proof exists)
- Crafting a ledger update that allocates the funds to the players.
- Waiting for a ledger response from the opponent, and offering the option to challenge if they are unresponsive.
- Crafting a conclude commitment to close the ledger channel.
- Allowing the ledger channel to be finalized via an expired challenge

## State machine

```mermaid
graph TD
linkStyle default interpolate basis
  St(( ))-->DF{Defundable?}
  DF --> |No| F(( ))
  DF --> |Yes, Player A| CLU(ConfirmLedgerUpdate)
  DF --> |Yes, Player B| WLU(WaitForLedgerUpdate)

  CLU-->|UPDATE_CONFIRMED|WLU
  CLU.->|CHALLENGE_EXPIRED| ALF(AcknowledgeLedgerFinalized)
  CLU.->|CHALLENGE_DETECTED|CLU

  WLU-->|COMMITMENT_RECEIVED|CLU
  WLU-->|CHALLENGE_RESPONSE_DETECETD|CLU
  WLU.->|CHALLENGE_CHOSEN|WLU
  WLU.->|CHALLENGE_EXPIRED|ALF
  WLU-->|COMMITMENT_RECEIVED|ALF

  ALF-->Su(( ))

  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;

  class St,DF logic;
  class Su Success;
  class F Failure;
```

Note: `UPDATE_CONFIRMED` will either send a commitment to the other player or submit a challenge response to the adjudicator.

## Scenarios

1. **Happy Path - Player A**
   - Start
   - ConfirmLedgerUpdate + UPDATE_CONFIRMED
   - WaitForLedgerUpdate + COMMITMENT_RECEIVED (consensus game update)
   - ConfirmLedgerUpdate + UPDATE_CONFIRMED
   - WaitForLedgerUpdate + COMMITMENT_RECEIVED (conclude)
   - AcknowledgeLedgerFinalized
2. **Happy Path - Player B**
   - Start
   - WaitForLedgerUpdate + COMMITMENT_RECEIVED (consensus game update)
   - ConfirmLedgerUpdate + UPDATE_CONFIRMED
   - WaitForLedgerUpdate + COMMITMENT_RECEIVED (conclude)
   - ConfirmLedgerUpdate + UPDATE_CONFIRMED
   - AcknowledgeLedgerFinalized
3. **Not De-fundable**
   - Start
   - Failure
4. **Player A: A ForceMoved by B, A Responds**
   - ConfirmLedgerUpdate + CHALLENGE_DETECTED
   - ConfirmLedgerUpdate + UPDATE_CONFIRMED
   - WaitForLedgerUpdate
5. **Player B: A ForceMoved by B, A Responds**
   - WaitForLedgerUpdate + CHALLENGE_CHOSEN
   - WaitForLedgerUpdate + CHALLENGE_RESPONSE_DETECTED
   - ConfirmLedgerUpdate
6. **Player A: A ForceMoved by B, Expires**
   - ConfirmLedgerUpdate + CHALLENGE_DETECTED
   - ConfirmLedgerUpdate + CHALLENGE_EXPIRED
   - AcknowledgeLedgerFinalized
7. **Player B: A ForceMoved by B, Expires**
   - WaitForLedgerUpdate + CHALLENGE_CHOSEN
   - WaitForLedgerUpdate + CHALLENGE_EXPIRED
   - ConfirmLedgerUpdate
