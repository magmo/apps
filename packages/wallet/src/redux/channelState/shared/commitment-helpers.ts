import { Commitment, CommitmentType } from 'fmg-core/lib/commitment';
import { signCommitment, validCommitmentSignature } from '../../../utils/signing-utils';
import { commitmentRelayRequested } from 'magmo-wallet-client';
import { Channel } from 'fmg-core/lib/channel';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator';

export const composePreFundCommitment = (
  channel: Channel,
  allocation: string[],
  destination: string[],
  ourIndex: number,
  appAttributes: string,
  privateKey: string,
) => {
  const turnNum = ourIndex;

  const preFundSetupCommitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PreFundSetup,
    turnNum,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const commitmentSignature = signCommitment(preFundSetupCommitment, privateKey);

  const sendCommitmentAction = commitmentRelayRequested(
    destination[1 - ourIndex],
    preFundSetupCommitment,
    commitmentSignature,
  );
  return { preFundSetupCommitment, commitmentSignature, sendCommitmentAction };
};

export const composeConsensusPreFundCommitment = (
  channel: Channel,
  allocation: string[],
  destination: string[],
  ourIndex: number,
  privateKey: string,
) => {
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation: allocation,
    proposedDestination: destination,
    consensusCounter: ourIndex,
  });
  return composePreFundCommitment(
    channel,
    allocation,
    destination,
    ourIndex,
    appAttributes,
    privateKey,
  );
};

export const composePostFundCommitment = (
  channel: Channel,
  lastCommitment: Commitment,
  turnNum: number,
  ourIndex: number,
  privateKey: string,
) => {
  const postFundSetupCommitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PostFundSetup,
    turnNum: turnNum + 1,
    commitmentCount: ourIndex,
    allocation: lastCommitment.allocation,
    destination: lastCommitment.destination,
    appAttributes: lastCommitment.appAttributes,
  };
  const commitmentSignature = signCommitment(postFundSetupCommitment, privateKey);

  const sendCommitmentAction = commitmentRelayRequested(
    channel.participants[1 - ourIndex],
    postFundSetupCommitment,
    commitmentSignature,
  );
  return { postFundSetupCommitment, commitmentSignature, sendCommitmentAction };
};

// TODO: Error handling needs to be properly implemented, this will do for now.
export const validPreFundSetupCommitment = (
  opponentCommitment: Commitment,
  opponentSignature: string,
  ourIndex: number,
  participants: string[],
): boolean => {
  if (opponentCommitment.commitmentType !== CommitmentType.PreFundSetup) {
    console.error('Expected PrefundSetup commitment.');
    return false;
  }
  if (opponentCommitment.commitmentCount !== 1 - ourIndex) {
    console.error(` Expected commitment count to be ${1 - ourIndex}`);
    return false;
  }
  const opponentAddress = participants[1 - ourIndex];
  if (!validCommitmentSignature(opponentCommitment, opponentSignature, opponentAddress)) {
    console.error('Invalid signature');
    return false;
  }
  return true;
};
