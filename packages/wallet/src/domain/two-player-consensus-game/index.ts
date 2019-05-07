import {
  AppAttributes,
  appAttributes,
  ConsensusBaseCommitment,
  ConsensusReachedCommitment,
  ProposalCommitment,
  UpdateType,
} from 'fmg-nitro-adjudicator/lib/consensus-app';
import { Bytes, Commitment } from 'fmg-core';
import abi from 'web3-eth-abi';
import { CommitmentType } from '../commitments';
/////////////
// Helpers //
/////////////

const SolidityConsensusCommitmentType = {
  ConsensusCommitmentStruct: {
    furtherVotesRequired: 'uint32',
    proposedAllocation: 'uint256[]',
    proposedDestination: 'address[]',
    updateType: 'uint32',
  },
};

export function encodeAppAttributes(appAttrs: AppAttributes): Bytes {
  return abi.encodeParameter(SolidityConsensusCommitmentType, [
    appAttrs.furtherVotesRequired,
    appAttrs.proposedAllocation,
    appAttrs.proposedDestination,
    appAttrs.updateType,
  ]);
}

export function decodeAppAttributes(appAttrs: Bytes): AppAttributes {
  return appAttributes(abi.decodeParameter(SolidityConsensusCommitmentType, appAttrs));
}

export function asCoreCommitment(commitment: ConsensusBaseCommitment): Commitment {
  const {
    channel,
    updateType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    furtherVotesRequired,
    proposedAllocation,
    proposedDestination,
  } = commitment;

  return {
    channel,
    commitmentType: CommitmentType.App,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    appAttributes: encodeAppAttributes({
      furtherVotesRequired,
      proposedAllocation,
      proposedDestination,
      updateType,
    }),
  };
}

// TODO it is weird/unexpected to use the conditional return
export function fromCoreCommitment(
  commitment: Commitment,
): ConsensusReachedCommitment | ProposalCommitment {
  const { channel, turnNum, allocation, destination, commitmentCount } = commitment;
  const {
    furtherVotesRequired,
    proposedAllocation,
    updateType,
    proposedDestination,
  } = decodeAppAttributes(commitment.appAttributes);
  if (updateType === UpdateType.Consensus) {
    return {
      channel,
      turnNum,
      allocation,
      destination,
      commitmentCount,
      updateType,
      furtherVotesRequired,
      proposedAllocation,
      proposedDestination,
    };
  } else {
    return {
      channel,
      turnNum,
      allocation,
      destination,
      commitmentCount,
      updateType,
      furtherVotesRequired,
      proposedAllocation,
      proposedDestination,
    };
  }
}
