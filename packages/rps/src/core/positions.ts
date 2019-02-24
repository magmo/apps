import { Move } from './moves';
import { soliditySha3 } from 'web3-utils';
import { padBytes32, Commitment, BaseCommitment, CommitmentType, Bytes, Uint256, Uint8, Bytes32, Uint32 } from 'fmg-core';
import abi from 'web3-eth-abi';
import { defaultPath } from 'ethers/utils/hdnode';

// Position names
// ==============
export const PRE_FUND_SETUP_A = 'PRE_FUND_SETUP_A';
export const PRE_FUND_SETUP_B = 'PRE_FUND_SETUP_B';
export const POST_FUND_SETUP_A = 'POST_FUND_SETUP_A';
export const POST_FUND_SETUP_B = 'POST_FUND_SETUP_B';
export const PROPOSE = 'PROPOSE';
export const ACCEPT = 'ACCEPT';
export const REVEAL = 'REVEAL';
export const RESTING = 'RESTING';
export const CONCLUDE = 'CONCLUDE';

interface AppAttributes {
  positionType: Uint8;
  stake: Uint256;
  preCommit: Bytes32;
  bPlay: Uint8;
  aPlay: Uint8;
  salt: Bytes32;
  roundNum: Uint32;
}

const SolidityRPSCommitmentType = {
  "RPSCommitmentStruct": {
    positionType: "uint8",
    stake: "uint256",
    preCommit: "bytes32",
    bPlay: "uint8",
    aPlay: "uint8",
    salt: "bytes32",
    roundNum: "uint32",
  },
};

export function bytesFromAppAttributes(appAttrs: AppAttributes): Bytes {
  const { positionType, stake, preCommit, bPlay, aPlay, salt, roundNum, } = appAttrs;
  return abi.encodeParameter(SolidityRPSCommitmentType, [
    positionType, stake, preCommit, bPlay, aPlay, salt, roundNum, 
  ]);
}

// Positions
// =========

// Properties shared by every position
// interface Base {
//   libraryAddress: string;
//   channelNonce: number;
//   participants: [string, string];
//   turnNum: number;
//   balances: [string, string];
// }

// All positions apart from Conclude also have the buyIn
interface BaseWithAppAttributes extends BaseCommitment {
  appAttributes: AppAttributes;
}

export interface PreFundSetupA extends BaseWithAppAttributes {
  commitmentCount: 0;
  commitmentType: CommitmentType.PreFundSetup;
  name: typeof PRE_FUND_SETUP_A;
}

export interface PreFundSetupB extends BaseWithAppAttributes {
  commitmentCount: 1;
  commitmentType: CommitmentType.PreFundSetup;
  name: typeof PRE_FUND_SETUP_B;
}

export interface PostFundSetupA extends BaseWithAppAttributes {
  commitmentCount: 0;
  commitmentType: CommitmentType.PostFundSetup;
  name: typeof POST_FUND_SETUP_A;
}

export interface PostFundSetupB extends BaseWithAppAttributes {
  commitmentCount: 1;
  commitmentType: CommitmentType.PostFundSetup;
  name: typeof POST_FUND_SETUP_B;
}

export interface Propose extends BaseWithAppAttributes {
  name: typeof PROPOSE;
  commitmentType: CommitmentType.App;
}

export interface Accept extends BaseWithAppAttributes {
  name: typeof ACCEPT;
  commitmentType: CommitmentType.App;
}

export interface Reveal extends BaseWithAppAttributes {
  name: typeof REVEAL;
  commitmentType: CommitmentType.App;
}

export interface Resting extends BaseWithAppAttributes {
  name: typeof RESTING;
  commitmentType: CommitmentType.App;
}

export interface Conclude extends BaseWithAppAttributes {
  name: typeof CONCLUDE;
  commitmentType: CommitmentType.Conclude;
}

export type Position = (
  | PreFundSetupA
  | PreFundSetupB
  | PostFundSetupA
  | PostFundSetupB
  | Propose
  | Accept
  | Reveal
  | Resting
  | Conclude
);

// Position Constructors
// =====================

interface BaseWithBuyInParams extends BaseCommitment {
  roundBuyIn: string;
}

function base(obj: BaseCommitment): BaseCommitment {
  const {
    channel,
    turnNum,
    allocation,
    destination,
    commitmentCount,
  } = obj;
  return {
    channel,
    turnNum,
    allocation,
    destination,
    commitmentCount,
  };
}

const zeroBytes32: Bytes32 = "0x" + "0".repeat(64);
function defaultAppAttrs (roundBuyin: Uint256): AppAttributes {
  return {
    stake: zeroBytes32,
    positionType: 0,
    preCommit: zeroBytes32,
    bPlay: 0,
    aPlay: 0,
    salt: zeroBytes32,
    roundNum: 0,
  };
}

export function preFundSetupA(obj: BaseWithBuyInParams): PreFundSetupA {
  return {
    ...base(obj),
    name: PRE_FUND_SETUP_A,
    commitmentCount: 0,
    commitmentType: CommitmentType.PreFundSetup,
    appAttributes: defaultAppAttrs(obj.roundBuyIn),
  };
}

export function preFundSetupB(obj: BaseWithBuyInParams): PreFundSetupB {
  return {
    ...base(obj),
    name: PRE_FUND_SETUP_B,
    commitmentCount: 1,
    commitmentType: CommitmentType.PreFundSetup,
    appAttributes: defaultAppAttrs(obj.roundBuyIn),
  };
}

export function postFundSetupA(obj: BaseWithBuyInParams): PostFundSetupA {
  return {
    ...base(obj),
    name: POST_FUND_SETUP_A,
    commitmentCount: 0,
    commitmentType: CommitmentType.PostFundSetup,
    appAttributes: defaultAppAttrs(obj.roundBuyIn),
  };
}

export function postFundSetupB(obj: BaseWithBuyInParams): PostFundSetupB {
  return {
    ...base(obj),
    name: POST_FUND_SETUP_B,
    commitmentCount: 1,
    commitmentType: CommitmentType.PostFundSetup,
    appAttributes: defaultAppAttrs(obj.roundBuyIn),
  };
}

interface ProposeParams extends BaseWithBuyInParams {
  preCommit: string;
}

export function propose(obj: ProposeParams): Propose {
  const appAttributes: AppAttributes = {
    ...defaultAppAttrs(obj.roundBuyIn),
    preCommit: obj.preCommit,
  };
  return {
    ...base(obj),
    name: PROPOSE,
    commitmentType: CommitmentType.App,
    appAttributes,
  };
}

export function hashCommitment(play: Move, salt: string) {
  return soliditySha3(
    { type: 'uint256', value: play },
    { type: 'bytes32', value: padBytes32(salt) },
  );
}

interface ProposeWithMoveAndSaltParams extends BaseWithBuyInParams {
  salt: string;
  aPlay: Move;
}
export function proposeFromSalt(obj: ProposeWithMoveAndSaltParams): Propose {
  const { salt, aPlay } = obj;
  const preCommit = hashCommitment(aPlay, salt);
  const appAttributes = {
    ...defaultAppAttrs(obj.roundBuyIn),
    preCommit,
    salt,
    aPlay,
  };
  return {
    ...base(obj),
    name: PROPOSE,
    commitmentType: CommitmentType.App,
    appAttributes,
  };
}

interface AcceptParams extends BaseWithBuyInParams {
  preCommit: string;
  bPlay: Move;
}

export function accept(obj: AcceptParams): Accept {
  const { preCommit, bPlay } = obj;
  return {
    ...base(obj),
    name: ACCEPT,
    commitmentType: CommitmentType.App,
    appAttributes: {
      ...defaultAppAttrs(obj.roundBuyIn),
      preCommit,
      bPlay,
    },
  };
}

interface RevealParams extends BaseWithBuyInParams {
  bPlay: Move;
  aPlay: Move;
  salt: string;
}

export function reveal(obj: RevealParams): Reveal {
  const { aPlay, bPlay, salt } = obj;
  return {
    ...base(obj),
    name: REVEAL,
    commitmentType: CommitmentType.App,
    appAttributes: {
      ...defaultAppAttrs(obj.roundBuyIn),
      aPlay,
      bPlay,
      salt,
    },
  };
}

export function resting(obj: BaseWithBuyInParams): Resting {
  return {
    ...base(obj),
    name: RESTING,
    commitmentType: CommitmentType.App,
    appAttributes: {
      ...defaultAppAttrs(obj.roundBuyIn),
    },
  };
}

export function conclude(obj: BaseCommitment): Conclude {
  return {
    ...base(obj),
    name: CONCLUDE,
    commitmentType: CommitmentType.Conclude,
    appAttributes: defaultAppAttrs(zeroBytes32),
  };
}
