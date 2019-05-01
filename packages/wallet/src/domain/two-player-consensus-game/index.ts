// This is copy-pasted from fmg-nitro-adjudicator
import { CommitmentType, Uint32, Uint256, Address, Bytes, BaseCommitment } from 'fmg-core';
import abi from 'web3-eth-abi';
import { bigNumberify } from 'ethers/utils';

export interface AppAttributes {
  consensusCounter: Uint32;
  proposedAllocation: Uint256[];
  proposedDestination: Address[];
}

interface ConsensusGameBaseCommitment extends BaseCommitment {
  consensusCounter: Uint32;
  proposedAllocation: Uint256[];
  proposedDestination: Address[];
}

////////////////
// Interfaces //
////////////////

interface PreFundSetupCommitment extends ConsensusGameBaseCommitment {
  commitmentType: CommitmentType.PreFundSetup;
  appAttributes: string;
}

interface PostFundSetupCommitment extends ConsensusGameBaseCommitment {
  commitmentType: CommitmentType.PostFundSetup;
  appAttributes: string;
}

interface ConsensusCommitment extends ConsensusGameBaseCommitment {
  commitmentType: CommitmentType.App;
  consensusType: 'Consensus';
  appAttributes: string;
}

interface ProposalCommitment extends ConsensusGameBaseCommitment {
  commitmentType: CommitmentType.App;
  consensusType: 'Proposal';
  appAttributes: string;
}

//////////////////
// Constructors //
//////////////////

function preFundSetupCommitment(opts: ConsensusGameBaseCommitment): PreFundSetupCommitment {
  return {
    ...opts,
    commitmentType: CommitmentType.PreFundSetup,
    appAttributes: bytesFromAppAttributes(opts),
  };
}

function postFundSetupCommitment(opts: ConsensusGameBaseCommitment): PostFundSetupCommitment {
  return {
    ...opts,
    commitmentType: CommitmentType.PostFundSetup,
    appAttributes: bytesFromAppAttributes(opts),
  };
}

function consensusCommitment(opts: ConsensusGameBaseCommitment): ConsensusCommitment {
  return {
    ...opts,
    consensusCounter: 0,
    commitmentType: CommitmentType.App,
    consensusType: 'Consensus',
    appAttributes: bytesFromAppAttributes(opts),
  };
}

function proposalCommitment(opts: ConsensusGameBaseCommitment): ProposalCommitment {
  return {
    ...opts,
    consensusCounter: 1,
    commitmentType: CommitmentType.App,
    consensusType: 'Proposal',
    appAttributes: bytesFromAppAttributes(opts),
  };
}

function concludeCommitment(opts: ConsensusGameBaseCommitment) {
  return {
    ...opts,
    commitmentType: CommitmentType.Conclude,
    appAttributes: bytesFromAppAttributes(opts),
  };
}

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

export function bytesFromAppAttributes(appAttrs: AppAttributes): Bytes {
  return abi.encodeParameter(SolidityConsensusCommitmentType, [
    appAttrs.consensusCounter,
    appAttrs.proposedAllocation,
    appAttrs.proposedDestination,
  ]);
}

export function appAttributesFromBytes(appAttrs: Bytes): AppAttributes {
  return appAttributes(abi.decodeParameter(SolidityConsensusCommitmentType, appAttrs));
}

type ConsensusGameAppCommitment = ConsensusCommitment | ProposalCommitment;

// function initialize(channelDetails: ??, initialOutcome: Outcome): Proposal

export function accept(commitment: ProposalCommitment): ConsensusCommitment {
  return consensusCommitment({
    ...commitment,
    turnNum: commitment.turnNum + 1,
    allocation: commitment.proposedAllocation,
    destination: commitment.proposedDestination,
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
  commitment: ConsensusGameAppCommitment,
): commitment is ConsensusCommitment {
  return commitment.consensusType === 'Consensus';
}
export function isProposal(
  commitment: ConsensusGameAppCommitment,
): commitment is ProposalCommitment {
  return commitment.consensusType === 'Proposal';
}

// how to encode app attributes?
