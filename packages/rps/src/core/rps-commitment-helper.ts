
import { soliditySha3 } from 'web3-utils';
import { padBytes32, BaseCommitment, CommitmentType, Bytes32 } from 'fmg-core';
import { AppAttributes, RPSCommitment, Play, PositionType } from './rps-commitment';

// Commitment names
const PRE_FUND_SETUP_A = 'PRE_FUND_SETUP_A';
const PRE_FUND_SETUP_B = 'PRE_FUND_SETUP_B';
const POST_FUND_SETUP_A = 'POST_FUND_SETUP_A';
const POST_FUND_SETUP_B = 'POST_FUND_SETUP_B';
const APP_PROPOSE = 'APP:PROPOSE';
const APP_ACCEPT = 'APP:ACCEPT';
const APP_REVEAL = 'APP:REVEAL';
const APP_RESTING = 'APP:RESTING';
const CONCLUDE = 'CONCLUDE';

// Commitment Constructors
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
function defaultAppAttrs(roundBuyIn): AppAttributes {
  return {
    stake: roundBuyIn,
    positionType: 0,
    preCommit: zeroBytes32,
    bPlay: 0,
    aPlay: 0,
    salt: zeroBytes32,
  };
}

export function preFundSetupA(obj: BaseWithBuyInParams): RPSCommitment {
  return {
    ...base(obj),
    commitmentCount: 0,
    commitmentType: CommitmentType.PreFundSetup,
    ...defaultAppAttrs(obj.roundBuyIn),
    commitmentName: PRE_FUND_SETUP_A,
  };
}

export function preFundSetupB(obj: BaseWithBuyInParams): RPSCommitment {
  return {
    ...base(obj),
    commitmentCount: 1,
    commitmentType: CommitmentType.PreFundSetup,
    ...defaultAppAttrs(obj.roundBuyIn),
    commitmentName: PRE_FUND_SETUP_B,
  };
}

export function postFundSetupA(obj: BaseWithBuyInParams): RPSCommitment {
  return {
    ...base(obj),
    commitmentCount: 0,
    commitmentType: CommitmentType.PostFundSetup,
    ...defaultAppAttrs(obj.roundBuyIn),
    commitmentName: POST_FUND_SETUP_A,
  };
}

export function postFundSetupB(obj: BaseWithBuyInParams): RPSCommitment {
  return {
    ...base(obj),
    commitmentCount: 1,
    commitmentType: CommitmentType.PostFundSetup,
    ...defaultAppAttrs(obj.roundBuyIn),
    commitmentName: POST_FUND_SETUP_B,
  };
}

interface ProposeParams extends BaseWithBuyInParams {
  preCommit: string;
}

export function propose(obj: ProposeParams): RPSCommitment {
  const appAttributes: AppAttributes = {
    ...defaultAppAttrs(obj.roundBuyIn),
    preCommit: obj.preCommit,
    positionType: PositionType.Proposed,
  };
  return {
    ...base(obj),
    commitmentType: CommitmentType.App,
    ...appAttributes,
    commitmentName: APP_PROPOSE,
  };
}

export function hashCommitment(play: Play, salt: string) {
  return soliditySha3(
    { type: 'uint256', value: play },
    { type: 'bytes32', value: padBytes32(salt) },
  );
}

interface ProposeWithMoveAndSaltParams extends BaseWithBuyInParams {
  salt: string;
  aPlay: Play;
}
export function proposeFromSalt(obj: ProposeWithMoveAndSaltParams): RPSCommitment {
  const { salt, aPlay } = obj;
  const preCommit = hashCommitment(aPlay, salt);
  const appAttributes = {
    ...defaultAppAttrs(obj.roundBuyIn),
    preCommit,
    salt,
    aPlay,
    positionType: PositionType.Proposed,
  };
  return {
    ...base(obj),
    commitmentType: CommitmentType.App,
    ...appAttributes,
    commitmentName: APP_PROPOSE,
  };
}

interface AcceptParams extends BaseWithBuyInParams {
  preCommit: string;
  bPlay: Play;
}

export function accept(obj: AcceptParams): RPSCommitment {
  const { preCommit, bPlay } = obj;
  return {
    ...base(obj),
    commitmentType: CommitmentType.App,
    ...defaultAppAttrs(obj.roundBuyIn),
    preCommit,
    bPlay,
    positionType: PositionType.Accepted,
    commitmentName: APP_ACCEPT,
  };
}

interface RevealParams extends BaseWithBuyInParams {
  bPlay: Play;
  aPlay: Play;
  salt: string;
}

export function reveal(obj: RevealParams): RPSCommitment {
  const { aPlay, bPlay, salt } = obj;
  return {
    ...base(obj),
    commitmentType: CommitmentType.App,
    ...defaultAppAttrs(obj.roundBuyIn),
    aPlay,
    bPlay,
    salt,
    positionType: PositionType.Reveal,
    commitmentName: APP_REVEAL,
  };
}

export function resting(obj: BaseWithBuyInParams): RPSCommitment {
  return {
    ...base(obj),
    commitmentType: CommitmentType.App,
    ...defaultAppAttrs(obj.roundBuyIn),
    positionType: PositionType.Resting,
    commitmentName: APP_RESTING,
  };
}

export function conclude(obj: BaseCommitment): RPSCommitment {
  return {
    ...base(obj),
    commitmentType: CommitmentType.Conclude,
    ...defaultAppAttrs(zeroBytes32),
    commitmentName: CONCLUDE,
  };
}
