# Virtual Channels

## Goal

Minimum viable implementation of the hub that allows 2 participants to open, fund, and conclude a virtual channel which an enables an application channel. The hub will not protect itself from losing funds or signing messages that are directly against its interest.

## Changes required

### Three party consensus channels

- Update the hub to process multiple commitments. Handle commitments received assumes a 2 party channel.
- Send commitment(s) to always send to the next participant as opposed to an "opponent".
- Similar strategy as the advance channel protocol: filter out commitments that the hub already knows about, then feed in the remaining commitments one-by-one.

### Guarantor channels

- (Maybe) Database models need to be expanded to support guarantor channels.
- Does the hub respond in the same way for all consensus channels (regardless of whether the channel is a guarantor channe or an allocator channel)?

### [NOT DOING] Broadcast current round of messages

- Maybe we won't deal with broadcasts for now
- Every new commitment created by the hub will be broadcast to all channel participants.
- What happens when a commitment(s) is received but it is not the hub's turn?

## Application channels

- Any changes needed?

## Start new processes?

- The hub does not _need_ to store the process id
- Would it be helpful throwing errors to detect inconsistent state?

## Protocol specific changes

### Funding

- _[Doesn't look like it]_ The server wallet might need to handle new virtual funding.

### Concluding

- _[Doesn't look like it]_ Any concluding specific changes?

### Challenging

- Not supported.
