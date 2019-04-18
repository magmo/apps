# Funding Protocol

The purpose of this protocol is to

1. Determine the funding strategy that will be used to fund a channel
2. Initialize the protocol for the corresponding strategy
3. Route further actions to that strategy's protocol

Out of scope (for now):

Supporting protocols other than indirect funding
Should be triggered by the FUNDING_REQUESTED event from the app.
Asking the user to confirm they want to fund the channel
[Handle case where protocol proposal arrives before they have accepted]
Sending a "protocol proposal" message to the opponent + waiting for confirmation
Launching the indirect funding protocol
Send out the post fund setup and wait for the return
Asking the user to confirm success and return to the app
Send FUNDING_SUCCESS message to app
