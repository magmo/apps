import {
  ConsensusBaseCommitment,
  ConsensusReachedCommitment,
  ProposalCommitment,
  bytesFromAppAttributes,
  appAttributesFromBytes,
  finalVote,
  propose,
  isProposal,
  isConsensusReached,
  ProposalAppAttrs,
  ConsensusAppAttrs,
} from 'fmg-nitro-adjudicator/lib/consensus-app';
import { Commitment } from 'fmg-core';
import { CommitmentType } from '../commitments';
/////////////
// Helpers //
/////////////

export function acceptConsensus(commitment: Commitment): Commitment {
  const fromCommitment = fromCoreCommitment(commitment);
  if (!isProposal(fromCommitment)) {
    throw new Error('The received commitment was not a ledger proposal');
  }
  return asCoreCommitment(finalVote(fromCommitment));
}

// TODO: Should we use a Balance interface instead of proposedAlloc/Dest
export function proposeNewConsensus(
  commitment: Commitment,
  proposedAllocation: string[],
  proposedDestination: string[],
): Commitment {
  const fromCommitment = fromCoreCommitment(commitment);
  if (!isConsensusReached(fromCommitment)) {
    throw new Error('The received commitment was not a ledger consensus');
  }
  const proposeCommitment = propose(fromCommitment, proposedAllocation, proposedDestination);
  return asCoreCommitment(proposeCommitment);
}

export function asCoreCommitment(commitment: ConsensusBaseCommitment): Commitment {
  const { channel, turnNum, allocation, destination, commitmentCount, appAttributes } = commitment;
  const {
    updateType,
    furtherVotesRequired,
    proposedAllocation,
    proposedDestination,
  } = appAttributes;

  return {
    channel,
    commitmentType: CommitmentType.App,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    appAttributes: bytesFromAppAttributes({
      furtherVotesRequired,
      proposedAllocation,
      proposedDestination,
      updateType,
    }),
  };
}

export function fromCoreCommitment(
  commitment: Commitment,
): ConsensusReachedCommitment | ProposalCommitment {
  const appAttributes: ProposalAppAttrs | ConsensusAppAttrs = appAttributesFromBytes(
    commitment.appAttributes,
  );
  return {
    ...commitment,
    appAttributes,
  } as ConsensusReachedCommitment | ProposalCommitment; // We know it has to be one of these...
}
