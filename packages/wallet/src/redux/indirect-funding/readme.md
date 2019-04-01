# Indirect Funding

The indirect funding module coordinates the process of funding an application channel via a ledger channel.

## How do actions get routed to the indirect funding module?

The wallet uses the `process` on the action to decide which module to route it to. For example, the following action will be processed by the indirect funding module:

```js
{
  type: 'ledger-updated',
  process: 'indirect-funding',
  channelId: 'abc123'
}
```

In order for this to work the following things must happen:

- Wallet messages sent to an opponent must include the `process` and `channelID` information, so that they can be correctly routed on receipt.
- Transactions sent to the `TransactionSender` must also include the `process` and `channelId`, so that the `TransactionSender` can include these properties on the `TransactionSubmitted` and `TransactionConfirmed` events.
- Any actions triggered from the UI during the indirect funding process must include the `process` property.

The `indirect-funding` module takes top priority for actions marked for it: these actions are always sent to the indirect funding reducer and they are not then sent anywhere else.

## What is the signature of the indirect-funding reducer?

For the time being, the indirect-funding reducer will accept an _initialized wallet state_ and return an _initialized wallet state_:

```ts
function indirectFundingReducer(state: Initialized, action: IndirectFundingAction): Initialized {
  // ...
}
```

The reducer acts on the entire state.

## How does the indirectFundingReducer handle actions?

The indirect funding process is not symmetric: the states you pass through depend if you are player A (the first player in the outcome at the time of funding) or player B. We model this by having a separate state machine for each player.

When handling actions, the `indirectFundingReducer` does the following:

1. Look up the current state of the funding process corresponding to the `channelId` in the action.
2. Determine from this state whether we are Player A or Player B.
3. Delegate to the reducer for player A or B as appropriate.

The player A and player B reducers encode the state transitions for their respective state machines. For example, player A's state machine is as follows:

```mermaid
graph TD
  N1(WaitForApproval) -->|ProposeStrategy| N2(WaitForStrategyResponse)
  N2 --> |Send PreFundSetup| N3(WaitForPreFundSetup1)
  N3 --> |Send transaction| N4(WaitForLedgerDeposit0Submission)
  N4 --> |Transaction sent!| N5(WaitForLedgerDeposit0Confirmation)
  N5 --> |Notify opponent| N6(WaitForDeposit1Submission)
  N6 --> |Opponent notifies| N7(WaitForDeposit1Confirmation)
  N7 --> |Transaction confirmed, send PostFundSetup| N8(WaitForLedgerPostFundSetup1)
  N8 --> |PostFundSetup received, send Update| N9(WaitForLedgerUpdate1)
  N9 --> |Update received| N10(Success)
```

### Example: receiving PostFundSetup1

1. The `MessageReceiver` receives a message:
   ```
   { process: 'indirect-funding', channelId: 'abc123', data: '0x123a32...' }
   ```
2. It triggers a `MessageReceived` action:
   ```
   { type: 'message-received', process: 'indirect-funding', channelId: 'abc123', commitment: '0x123a32...' }
   ```
3. This is routed to the `IndirectFundingReducer`, which looks to see if there's a current indirect funding for channel `abc123`. The player on the state is player A, so the request is delegated to the `PlayerAReducer`.
4. The `PlayerAReducer` sees that it is in the `WaitForLedgerPostFundSetup1` state.
5. It fetches the ledger channel data, `ledgerState`, from the channel store and calls the channel reducer:
   ```ts
   newLedgerState = channelReducer(ledgerState, action);
   ```
6. It sees whether `newLedgerState` is now in the `running` state (which will be the case if it received a valid PostFundSetup). If it is, it constructs the state change that will fund the application channel, `fundingCommitment`.
7. It then calls the `channelReducer` again with an `ownPositionReceived` action, which will cause it to check, store and sign the `fundingCommitment`.
8. It then sends this `fundingCommitment` to its opponent.

## What about re-using our existing direct funding code?

I think that, for the time being, we should just duplicate the direct funding code inside the indirect funding. It should be easy to factor this out later and it avoids having to decide upfront what the interface should be between these two different processes.

## State machines

```mermaid
  graph TD
  linkStyle default interpolate basis
    SOME_STATE -->|SOME_ACTION| ANOTHER_STATE

    ANOTHER_STATE -->|SOME_ACTION| terminated{TERMINATED}
```

Once the state machine reaches a terminated state, the process is dismantled.

### Player A

```mermaid
  graph TD
  linkStyle default interpolate basis
    WAIT_FOR_APPROVAL -->|INDIRECT_FUNDING_APPROVED| WAIT_FOR_INDIRECT_STRATEGY_RESPONSE[WAIT_FOR_STRATEGY_RESPONSE: INDIRECT]
    WAIT_FOR_APPROVAL -->|DIRECT_FUNDING_APPROVED| WAIT_FOR_DIRECT_STRATEGY_RESPONSE[WAIT_FOR_STRATEGY_RESPONSE: DIRECT]

    WAIT_FOR_INDIRECT_STRATEGY_RESPONSE -->|STRATEGY_AGREED| WAIT_FOR_PREFUND_SETUP1
    WAIT_FOR_INDIRECT_STRATEGY_RESPONSE -->|STRATEGY_REFUSED| fail{ FAIL }

    WAIT_FOR_PREFUND_SETUP1 -->|RECEIVE_COMMITMENT| indirect[WAIT_FOR_DIRECT_FUNDING]

    indirect[WAIT_FOR_DIRECT_FUNDING] -->|FUNDING_EVENT| indirect[WAIT_FOR_DIRECT_FUNDING]
    indirect[WAIT_FOR_DIRECT_FUNDING] -->|"FUNDING_RECEIVED_EVENT(funded)"| WAIT_FOR_POST_FUND_SETUP1

    WAIT_FOR_POST_FUND_SETUP1 --> |RECEIVE_COMMITMENT| WAIT_FOR_LEDGER_UPDATE1

    WAIT_FOR_LEDGER_UPDATE1 --> |RECEIVE_COMMITMENT| success{ SUCCESS }

    WAIT_FOR_DIRECT_STRATEGY_RESPONSE -->|STRATEGY_AGREED| direct[WAIT_FOR_DIRECT_FUNDING]

    direct[WAIT_FOR_DIRECT_FUNDING] -->|FUNDING_EVENT| direct[WAIT_FOR_DIRECT_FUNDING]
    direct[WAIT_FOR_DIRECT_FUNDING] -->|"FUNDING_RECEIVED_EVENT(funded)"| success{ SUCCESS }

    WAIT_FOR_DIRECT_STRATEGY_RESPONSE -->|STRATEGY_REFUSED| fail{ FAIL }
```

### Player B

```mermaid
  graph TD
  linkStyle default interpolate basis
    WAIT_FOR_STRATEGY_REQUEST -->|INDIRECT| indirectStrategy[WAIT_FOR_APPROVAL]
    WAIT_FOR_STRATEGY_REQUEST -->|DIRECT| directStrategy[WAIT_FOR_APPROVAL]

    indirectStrategy[WAIT_FOR_APPROVAL] -->|FUNDING_APPROVED| WAIT_FOR_PREFUND_SETUP0
    indirectStrategy[WAIT_FOR_APPROVAL] -->|REJECTED| fail{FAIL}

    WAIT_FOR_PREFUND_SETUP0 -->|RECEIVE_COMMITMENT| WAIT_FOR_DIRECT_FUNDING

    WAIT_FOR_DIRECT_FUNDING -->|FUNDING_EVENT| WAIT_FOR_DIRECT_FUNDING
    WAIT_FOR_DIRECT_FUNDING -->|"FUNDING_RECEIVED_EVENT(funded)"| WAIT_FOR_POST_FUND_SETUP0

    WAIT_FOR_POST_FUND_SETUP0 --> |RECEIVE_COMMITMENT| WAIT_FOR_LEDGER_UPDATE0

    WAIT_FOR_LEDGER_UPDATE0 --> |RECEIVE_COMMITMENT| success{SUCCESS}

    directStrategy[WAIT_FOR_APPROVAL] -->|FUNDING_APPROVED| direct[WAIT_FOR_DIRECT_FUNDING]
    directStrategy[WAIT_FOR_APPROVAL] -->|REJECTED| fail{FAIL}
    direct[WAIT_FOR_DIRECT_FUNDING] -->|"FUNDING_RECEIVED_EVENT(funded)"| success{ SUCCESS }
```
