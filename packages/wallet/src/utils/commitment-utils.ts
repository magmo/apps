import { Commitment, CommitmentType } from 'magmo-wallet-client/node_modules/fmg-core';
import { appAttributesFromBytes, bytesFromAppAttributes } from 'fmg-nitro-adjudicator';
import { PlayerIndex } from '../redux/types';
import { signCommitment } from './signing-utils';
import { Channel } from 'fmg-core';
import { SignedCommitment } from 'src/redux/channel-state/shared/state';

export const hasConsensusBeenReached = (
  lastCommitment: Commitment,
  penultimateCommitment: Commitment,
): boolean => {
  const numOfPlayers = lastCommitment.channel.participants.length;
  const lastAppAttributes = appAttributesFromBytes(lastCommitment.appAttributes);
  const penultimateAppAttributes = appAttributesFromBytes(penultimateCommitment.appAttributes);

  if (
    lastAppAttributes.consensusCounter === numOfPlayers - 1 &&
    lastCommitment.allocation === penultimateAppAttributes.proposedAllocation &&
    lastCommitment.destination === penultimateAppAttributes.proposedDestination
  ) {
    return true;
  } else {
    return false;
  }
};

// Commitment composers

export const composeLedgerUpdateCommitment = (
  channel: Channel,
  turnNum: number,
  ourIndex: PlayerIndex,
  proposedAllocation: string[],
  proposedDestination: string[],
  allocation: string[],
  destination: string[],
  privateKey: string,
) => {
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation,
    proposedDestination,
    consensusCounter: ourIndex,
  });
  const commitment: Commitment = {
    channel,
    commitmentType: CommitmentType.App,
    turnNum,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const signature = signCommitment(commitment, privateKey);

  return { commitment, signature };
};

export const composePostFundCommitment = (
  lastCommitment: Commitment,
  ourIndex: PlayerIndex,
  privateKey: string,
): SignedCommitment => {
  const {
    channel,
    turnNum: previousTurnNum,
    allocation,
    destination,
    appAttributes,
  } = lastCommitment;
  const commitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PostFundSetup,
    turnNum: previousTurnNum + 1,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const signature = signCommitment(commitment, privateKey);

  return { commitment, signature };
};
export const composePreFundCommitment = (
  channel: Channel,
  allocation: string[],
  destination: string[],
  ourIndex: PlayerIndex,
  privateKey: string,
): SignedCommitment => {
  const appAttributes = bytesFromAppAttributes({
    proposedAllocation: allocation,
    proposedDestination: destination,
    consensusCounter: ourIndex,
  });
  const commitment: Commitment = {
    channel,
    commitmentType: CommitmentType.PreFundSetup,
    turnNum: ourIndex,
    commitmentCount: ourIndex,
    allocation,
    destination,
    appAttributes,
  };
  const signature = signCommitment(commitment, privateKey);

  return { commitment, signature };
};
