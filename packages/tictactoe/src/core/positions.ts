// import { soliditySha3 } from 'web3-utils';
// import { padBytes32 } from 'fmg-core';
// import { positions } from '.';
import {Marks} from './marks';
// Position names
// ==============
export const PRE_FUND_SETUP_A = 'PRE_FUND_SETUP_A';
export const PRE_FUND_SETUP_B = 'PRE_FUND_SETUP_B';
export const POST_FUND_SETUP_A = 'POST_FUND_SETUP_A';
export const POST_FUND_SETUP_B = 'POST_FUND_SETUP_B';
export const OPLAYING = 'OPLAYING';
export const XPLAYING = 'XPLAYING';
export const RESTING = 'RESTING';
export const VICTORY = 'VICTORY';
export const DRAW = 'DRAW';
export const CONCLUDE = 'CONCLUDE';

// Positions
// =========

// Properties shared by every position
interface Base {
  libraryAddress: string;
  channelNonce: number;
  participants: [string, string];
  turnNum: number;
  balances: [string, string];
}

// All positions apart from Conclude also have the buyIn
interface BaseWithBuyIn extends Base {
    roundBuyIn: string;
  }

interface BaseWitNoughtsAndCrosses extends Base {
    noughts: Marks;
    crosses: Marks;
  }
  
  export interface PreFundSetupA extends BaseWithBuyIn {
    stateCount: 0;
    name: typeof PRE_FUND_SETUP_A;
  }
  
  export interface PreFundSetupB extends BaseWithBuyIn {
    stateCount: 1;
    name: typeof PRE_FUND_SETUP_B;
  }
  
  export interface PostFundSetupA extends BaseWithBuyIn {
    stateCount: 0;
    name: typeof POST_FUND_SETUP_A;
  }
  
  export interface PostFundSetupB extends BaseWithBuyIn {
    stateCount: 1;
    name: typeof POST_FUND_SETUP_B;
  }
  

  export interface Resting extends BaseWithBuyIn {
    name: typeof RESTING;
  }

  export interface Oplaying extends BaseWithBuyIn {
    name: typeof OPLAYING;
    noughts: Marks;
    crosses: Marks;
  }

  export interface Xplaying extends BaseWithBuyIn {
    name: typeof XPLAYING;
    noughts: Marks;
    crosses: Marks;
  }
  
  export interface Victory extends BaseWitNoughtsAndCrosses {
    name: typeof VICTORY;
  }

  export interface Draw extends BaseWitNoughtsAndCrosses {
    name: typeof DRAW;

  }

  export interface Conclude extends Base {
    name: typeof CONCLUDE;
  }
  
  export type Position = (
    | PreFundSetupA
    | PreFundSetupB
    | PostFundSetupA
    | PostFundSetupB
    | Oplaying
    | Xplaying
    | Resting
    | Victory
    | Draw
    | Conclude
  );


// Position Constructors
// =====================

// Will be useful to be able to construct these positions from any object
// that includes the right properties
interface BaseParams extends Base {
  [x: string]: any;
}

interface BaseWithBuyInParams extends BaseParams {
  roundBuyIn: string;
}

interface PlayingParams extends BaseWithBuyInParams {
  noughts: Marks;
  crosses: Marks;
}

interface EndPlayingParams extends Base {
  noughts: Marks ;
  crosses: Marks;
}

function base(obj: BaseParams): Base {
  const { libraryAddress, channelNonce, participants, turnNum, balances } = obj;
  return { libraryAddress, channelNonce, participants, turnNum, balances };
}

function baseWithBuyIn(obj: BaseWithBuyInParams): BaseWithBuyIn {
  return { ...base(obj), roundBuyIn: obj.roundBuyIn };
}

function baseWithNoughtsAndCrosses(obj: BaseParams): BaseWitNoughtsAndCrosses {
  return { ...base(obj), noughts: obj.noughts, crosses: obj.crosses };
}

export function preFundSetupA(obj: BaseWithBuyInParams): PreFundSetupA {
  return { ...baseWithBuyIn(obj), name: PRE_FUND_SETUP_A, stateCount: 0 };
}

export function preFundSetupB(obj: BaseWithBuyInParams): PreFundSetupB {
  return { ...baseWithBuyIn(obj), name: PRE_FUND_SETUP_B, stateCount: 1 };
}

export function postFundSetupA(obj: BaseWithBuyInParams): PostFundSetupA {
  return { ...baseWithBuyIn(obj), name: POST_FUND_SETUP_A, stateCount: 0 };
}

export function postFundSetupB(obj: BaseWithBuyInParams): PostFundSetupB {
  return { ...baseWithBuyIn(obj), name: POST_FUND_SETUP_B, stateCount: 1 };
}


export function resting(obj: BaseWithBuyInParams): Resting {
  return { ...baseWithBuyIn(obj), name: RESTING };
}

export function Oplaying(obj: PlayingParams): Oplaying {
  return { ...baseWithBuyIn(obj), name: OPLAYING, ...obj };
}

export function Xplaying(obj: PlayingParams): Xplaying {
  return { ...baseWithBuyIn(obj), name: XPLAYING, ...obj };
}

export function victory(obj: EndPlayingParams): Victory {
  return { ...baseWithNoughtsAndCrosses(obj), name: VICTORY };
}

export function draw(obj: EndPlayingParams): Draw {
  return { ...baseWithNoughtsAndCrosses(obj), name: DRAW };
}

export function conclude(obj: BaseParams): Conclude {
  return { ...base(obj), name: CONCLUDE };
}






