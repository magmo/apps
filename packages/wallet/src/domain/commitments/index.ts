import { Commitment as C, CommitmentType as CT } from 'fmg-core';
import { channelID } from 'fmg-core/lib/channel';
import { signCommitment as signCommitmentUtil, validCommitmentSignature } from '../signing-utils';

export type Commitment = C;
export const CommitmentType = CT;
export type CommitmentType = CT;

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

// -------
// Helpers
// -------

// temporary name while we remove the old signCommitment method
export function signCommitment2(commitment: Commitment, privateKey: string): SignedCommitment {
  return { commitment, signature: signCommitmentUtil(commitment, privateKey) };
}

export function hasValidSignature(signedCommitment: SignedCommitment): boolean {
  const { commitment, signature } = signedCommitment;
  return validCommitmentSignature(commitment, signature);
}

export function getChannelId(commitment: Commitment): string {
  return channelID(commitment.channel);
}

function incrementTurnNum(commitment: Commitment): Commitment {
  return { ...commitment, turnNum: commitment.turnNum + 1 };
}

export function constructConclude(commitment: Commitment): Commitment {
  return { ...incrementTurnNum(commitment), commitmentType: CommitmentType.Conclude };
}

export function nextSetupCommitment(commitment: Commitment): Commitment | 'NotASetupCommitment' {
  const turnNum = commitment.turnNum + 1;
  const numParticipants = commitment.channel.participants.length;
  let commitmentType;
  let commitmentCount;
  if (turnNum <= numParticipants - 1) {
    commitmentType = CommitmentType.PreFundSetup;
    commitmentCount = turnNum;
  } else if (turnNum <= 2 * numParticipants - 1) {
    commitmentType = CommitmentType.PostFundSetup;
    commitmentCount = turnNum - numParticipants;
  } else {
    return 'NotASetupCommitment';
  }

  return { ...commitment, turnNum, commitmentType, commitmentCount };
}
