// This is copy-pasted from fmg-nitro-adjudicator
import {
  Commitment,
  CommitmentType,
  Uint32,
  Uint256,
  Address,
  Bytes,
  BaseCommitment,
} from 'fmg-core';
import abi from 'web3-eth-abi';
import { bigNumberify } from 'ethers/utils';

export interface AppAttributes {
  consensusCounter: Uint32;
  proposedAllocation: Uint256[];
  proposedDestination: Address[];
}

interface ConsensusGameBaseCommitment extends BaseCommitment {
  commitmentType: CommitmentType;
  consensusCounter: Uint32;
  proposedAllocation: Uint256[];
  proposedDestination: Address[];
}

////////////////
// Interfaces //
////////////////

interface ConsensusCommitment extends ConsensusGameBaseCommitment {
  consensusCounter: 0;
}

interface ProposalCommitment extends ConsensusGameBaseCommitment {
  consensusCounter: 1;
}

//////////////////
// Constructors //
//////////////////

function consensusCommitment(opts: ConsensusGameBaseCommitment): ConsensusCommitment {
  return {
    ...opts,
    consensusCounter: 0,
  };
}

function proposalCommitment(opts: ConsensusGameBaseCommitment): ProposalCommitment {
  return {
    ...opts,
    consensusCounter: 1,
  };
}

/////////////
// Helpers //
/////////////

export function appAttributes(
  consensusCommitmentArgs: [string, string[], string[]],
): AppAttributes {
  return {
    consensusCounter: parseInt(consensusCommitmentArgs[0], 10),
    proposedAllocation: consensusCommitmentArgs[1].map(bigNumberify).map(bn => bn.toHexString()),
    proposedDestination: consensusCommitmentArgs[2],
  };
}

const SolidityConsensusCommitmentType = {
  ConsensusCommitmentStruct: {
    consensusCounter: 'uint32',
    proposedAllocation: 'uint256[]',
    proposedDestination: 'address[]',
  },
};

export function encodeAppAttributes(appAttrs: AppAttributes): Bytes {
  return abi.encodeParameter(SolidityConsensusCommitmentType, [
    appAttrs.consensusCounter,
    appAttrs.proposedAllocation,
    appAttrs.proposedDestination,
  ]);
}

export function decodeAppAttributes(appAttrs: Bytes): AppAttributes {
  return appAttributes(abi.decodeParameter(SolidityConsensusCommitmentType, appAttrs));
}

export function asCoreCommitment(commitment: ConsensusGameBaseCommitment): Commitment {
  const {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    consensusCounter,
    proposedAllocation,
    proposedDestination,
  } = commitment;

  return {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    appAttributes: encodeAppAttributes({
      consensusCounter,
      proposedAllocation,
      proposedDestination,
    }),
  };
}

export function fromCoreCommitment(commitment: Commitment): ConsensusGameBaseCommitment {
  const { channel, turnNum, commitmentType, allocation, destination, commitmentCount } = commitment;
  const { consensusCounter, proposedAllocation, proposedDestination } = decodeAppAttributes(
    commitment.appAttributes,
  );
  return {
    channel,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    commitmentType,
    consensusCounter,
    proposedAllocation,
    proposedDestination,
  };
}

// TODO
// function initialize(channelDetails: ??, initialOutcome: Outcome): Proposal

export function accept(commitment: ProposalCommitment): ConsensusCommitment {
  return consensusCommitment({
    ...commitment,
    turnNum: commitment.turnNum + 1,
    allocation: commitment.proposedAllocation,
    destination: commitment.proposedDestination,
    // TODO should proposedAllocation be conserved, or reset?
  });
}

export function reject(commitment: ProposalCommitment): ConsensusCommitment {
  return consensusCommitment({
    ...commitment,
    turnNum: commitment.turnNum + 1,
    allocation: commitment.allocation,
    destination: commitment.destination,
    // TODO should proposedAllocation be conserved, or reset?
  });
}

export function propose(
  commitment: ConsensusCommitment,
  proposedAllocation: Uint256[],
  proposedDestination: Address[],
): ProposalCommitment {
  return proposalCommitment({
    ...commitment,
    turnNum: commitment.turnNum + 1,
    proposedAllocation,
    proposedDestination,
    // TODO should proposedAllocation be conserved, or reset?
  });
}

export function isConsensus(
  commitment: ConsensusGameBaseCommitment,
): commitment is ConsensusCommitment {
  return commitment.consensusCounter === 0;
}
export function isProposal(
  commitment: ConsensusGameBaseCommitment,
): commitment is ProposalCommitment {
  return commitment.consensusCounter === 1;
}

export function nextLedgerUpdateCommitment(
  coreCommitment: Commitment,
): Commitment | 'InputNotPrecedingAnUpdateCommitment' | 'InputNotAProposal' {
  const commitment = fromCoreCommitment(coreCommitment);
  const turnNum = commitment.turnNum + 1;
  if (coreCommitment.commitmentType !== CommitmentType.App || turnNum <= 4) {
    return 'InputNotPrecedingAnUpdateCommitment';
  }
  if (isProposal(commitment)) {
    // TODO reject instead (if some checks on the proposal do not pass)
    return asCoreCommitment(accept(commitment));
  } else {
    return 'InputNotAProposal';
  }
}
