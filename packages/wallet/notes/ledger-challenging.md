# Ledger challenging

Users may need to challenge opponents in ledger channels, for example during `indirect-funding` or `indirect-defunding`. Because the wallet plays the role of the consensus application, the usual message passing to 'the app' needs to be replaced by some other communication mechanism internal to the wallet. This note sets out a proposal for such a mechanism.

All steps are conditional on inferring that the challenge corresponds to a ledger challenge (else use current code to handle application channel challenges). This inference is made based on the application rules being the consensus game.

## Challenger

1. The user clicks 'launch challenge' on a protocol screen displayed inside a running process.
2. This dispatches a `WALLET.NEW_PROCESS.CREATE_CHALLENGE_REQUESTED`, with an optimsitic action embedded under `embdeddedProtocolAction: ProtocolAction`.
3. The `ledger-dispute-relay` saga dispatches the embedded action, progressing the protocol (optimistically, but this is harmless since if the dispute fails to be resolved the channel will be closed on chain).
4. The current process is displaced by (yields to) the dispute process (`currentProcessId` moved to `yieldingProcessId`).
5. The dispute process handles transaction submission etc in the usual way, but does not hide the wallet on termination, but instead passes back to the yielding process (`yieldingProcessId` becomes `currentProcessId`)

## Responder

1. As soon as a challenge is detected, the dispute process displaces the current process.
2. When the user agrees to respond, an appropriate `LEDGER_DISPUTE_DETECTED` action is embedded on the Dispute action, and dispatched by the `ledger-dispute-relay` saga. The dispute process yields to the yieldingProcess.
   ( alternative: The new process sends an _internal_ message for a challenge response )
3. The protocol is then progressed into a new state, or to avoid repitition back into the same state but with an `isRespondingToChallenge` boolean flag set. The relevant screen alerts the user that they are replying to a challenge, but otherwise dispatches the same action. The redcer then needs to update a new outbox state (call it `internalOutbox`) to trigger (via a saga) the dispute action `WALLET.DISPUTE.RESPONDER.RESPONSE_PROVIDED` (The protocol reducer can choose which outbox to post the commitment to based on the `isRespondingToChallenge?`flag). The process then yields to the dispute process again.
4. When the dispute proccess terminates, the wallet is not hidden but instead passes back to the yielding process again.
