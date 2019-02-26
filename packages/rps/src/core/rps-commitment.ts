import { BaseCommitment, Bytes32, Uint8, Uint256, Commitment, CommitmentType } from 'fmg-core';
import abi from 'web3-eth-abi';

export interface AppAttributes {
  positionType: Uint8;
  stake: Uint256;
  preCommit: Bytes32;
  bPlay: Uint8;
  aPlay: Uint8;
  salt: Bytes32;
}

const SolidityRPSCommitmentType = {
  "RPSCommitmentStruct": {
    positionType: "uint8",
    stake: "uint256",
    preCommit: "bytes32",
    bPlay: "uint8",
    aPlay: "uint8",
    salt: "bytes32",
  },
};
export enum PositionType { Resting, Proposed, Accepted, Reveal }
export enum Play { Rock, Paper, Scissors }
export interface RPSBaseCommitment extends BaseCommitment {
  positionType: PositionType;
  stake: Uint256;
  preCommit: Bytes32;
  bPlay: Play;
  aPlay: Play;
  salt: Bytes32;
}

export interface RPSCommitment extends RPSBaseCommitment {
  commitmentType: CommitmentType;
}


function encodeAppAttributes(appAttrs: AppAttributes): string {
  console.log(appAttrs);
  const { positionType, stake, preCommit, bPlay, aPlay, salt, } = appAttrs;
  console.log([positionType, stake, preCommit, bPlay, aPlay, salt,]);
  return abi.encodeParameter(SolidityRPSCommitmentType,
    [positionType, stake, preCommit, bPlay, aPlay, salt,]);
}

function decodeAppAttributes(appAttrs: string): AppAttributes {
  const parameters = abi.decodeParameter(SolidityRPSCommitmentType, appAttrs);
  return {
    positionType: parameters[0] as PositionType,
    stake: parameters[1],
    preCommit: parameters[2],
    bPlay: parameters[3] as Play,
    aPlay: parameters[4] as Play,
    salt: parameters[5],
  };
}

export function fromCoreCommitment(commitment: Commitment): RPSCommitment {
  const {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
  } = commitment;
  return {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    ...decodeAppAttributes(commitment.appAttributes),
  };
}


export function asCoreCommitment(rpsCommitment: RPSCommitment): Commitment {
  const {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    positionType,
    stake,
    preCommit,
    bPlay,
    aPlay,
    salt,
  } = rpsCommitment;

  return {
    channel,
    commitmentType,
    turnNum,
    allocation,
    destination,
    commitmentCount,
    appAttributes: encodeAppAttributes({ positionType, stake, preCommit, bPlay, aPlay, salt }),
  };
}