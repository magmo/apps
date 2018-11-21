// TODO change for Tic Tac Toe instead of Rock Paper Scissors
// to do this, one needs to understand the attributes that each position should have. 

import { Channel, State, toHex32, padBytes32 } from 'fmg-core';
import * as positions from './positions';
// import { Move } from './moves';
import hexToBN from '../utils/hexToBN';

export default function encode(position: positions.Position) {
  const { libraryAddress, channelNonce, participants, turnNum, balances } = position;
  const channel = new Channel(libraryAddress, channelNonce, participants);

  const stateCount = ('stateCount' in position) ? position.stateCount : 0;

  const state = new State({
    channel,
    stateType: stateType(position),
    turnNum,
    stateCount,
    resolution: balances.map(hexToBN),
  });

  return state.toHex() + encodeGameAttributes(position);
}

function stateType(position: positions.Position) {
  switch (position.name) {
    case positions.PRE_FUND_SETUP_A:
    case positions.PRE_FUND_SETUP_B:
      return State.StateType.PreFundSetup;
    case positions.POST_FUND_SETUP_A:
    case positions.POST_FUND_SETUP_B:
      return State.StateType.PostFundSetup;
    case positions.VICTORY:
      return State.StateType.Conclude;
    case positions.DRAW:
      return State.StateType.Conclude;
    default:
      return State.StateType.Game;
  }
}

function encodeGameAttributes(position: positions.Position) {
  switch (position.name) {
    case positions.PROPOSE:
      return packProposeAttributes(position);
    case positions.ACCEPT:
      return packAcceptAttributes(position);
    case positions.PLAYING:
      return packPlayingAttributes(position);
    case positions.VICTORY:
      return '';
    case positions.DRAW:
      return '';
    default:
      // unreachable
      return packRestingAttributes(position.roundBuyIn);
  }
}

export enum GamePositionType {
  Resting = 0,
  Propose = 1,
  Accept  = 2,
  Playing = 3 // I didn't include either of the concluding states (Victory and Draw)
}

export function packRestingAttributes(stake: string) {
  return toHex32(GamePositionType.Resting).substr(2) + stake.substr(2); // possible issues here in future when there are more than four GamePositionTypes? substr(2) may need to become substr(>2)
}

export function packProposeAttributes(position: positions.Propose) {
  const { roundBuyIn } = position;
  return (
    toHex32(GamePositionType.Propose).substr(2) +
    padBytes32(roundBuyIn).substr(2)
  );
}

export function packAcceptAttributes(position: positions.Accept) {
  const { roundBuyIn } = position;
  return (
    toHex32(GamePositionType.Accept).substr(2) +
    padBytes32(roundBuyIn).substr(2) 
  );
}

export function packPlayingAttributes(position: positions.Playing) {
  const { roundBuyIn, noughts, crosses } = position;
  return (
    toHex32(GamePositionType.Playing).substr(2) +
    padBytes32(roundBuyIn).substr(2) +
    toHex32(noughts).substr(2) +
    toHex32(crosses).substr(2) 
  );
}

// export function hashCommitment(move: Move, salt: string) {
//   return soliditySha3(
//     { type: 'uint256', value: move },
//     { type: 'bytes32', value: padBytes32(salt) },
//   );
// }

