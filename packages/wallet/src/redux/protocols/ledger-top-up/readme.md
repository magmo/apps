# Ledger Top Up Protocol

The purpose of the protocol is to top up an existing ledger channel so that it can be used to fund a game.

The protocol only handles performing a top up with two players. It works by:

1. Adding the top-up value to player A's allocation and moving it to the end via the consensus update protocol. The channel is underfunded after this but since A's allocation is last they are prevented from withdrawing too much.
2. Running the direct funding protocol for player A's deposit. The channel is now funded.
3. Adding the top-up value to player B's allocation and moving it to the end via the consensus update protocol. This restores the order and also protects player A.
4. Running the direct funding protocol for player B's deposit. The channel is now funded.

We always run through all four steps. If only one player requires a top up then their directFunding protocol will complete immediately and allow us to move onto the next step.
While this may result in extra communication it makes the control flow simpler.

## State machine

```mermaid
graph TD
  linkStyle default interpolate basis
  St((Start))-->WFLU1(SwitchOrderAndAddATopUpUpdate)
  WFLU1-->|Consensus Update Action|WFLU1
  WFLU1-->|Consensus Update Success|WFDF1(WaitForDirectFundingForPlayerA)
  WFDF1-->|Direct Funding Action|WFDF1(WaitForDirectFundingForPlayerA)
  WFDF1-->|Direct Funding Success|WFLU2
  WFLU2-->|Consensus Update Action|WFLU2
  WFLU2-->|Consensus Update Success|WFDF2
  WFDF2-->|Direct Funding Action|WFDF2(WaitForDirectFundingForPlayerB)
  WFDF2-->|Direct Funding Success|Su((success))

  classDef logic fill:#efdd20;
  classDef Success fill:#58ef21;
  classDef Failure fill:#f45941;
  classDef WaitForChildProtocol stroke:#333,stroke-width:4px,color:#ffff,fill:#333;
  class St,NT1,NT2 logic;
  class Su Success;
  class F Failure;
  class LT,WFLU1,WFLU2,WFDF1,WFDF2 WaitForChildProtocol;
```

## Scenarios

1. **Player A Happy Path** Start->SwitchOrderAndAddATopUpUpdate->WaitForDirectFundingForPlayerA->RestoreOrderAndAddBTopUpUpdate->WaitForDirectFundingForPlayerB->Success
2. **Player B Happy Path** Start->SwitchOrderAndAddATopUpUpdate->WaitForDirectFundingForPlayerA->RestoreOrderAndAddBTopUpUpdate->WaitForDirectFundingForPlayerB->Success
