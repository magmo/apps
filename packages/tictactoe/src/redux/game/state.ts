import { Result, Marks, Player } from '../../core';

// States of the form *A are player A only
// States of the form *B are player B only
// All other states are both players
export enum StateName {
  NoName = 'NO_NAME',
  Lobby = 'Lobby',
  CreatingOpenGame = 'CREATING_OPEN_GAME',
  WaitingRoom = 'WaitingRoom',
  WaitForGameConfirmationA = 'WAIT_FOR_GAME_CONFIRMATION_A',
  ConfirmGameB = 'CONFIRM_GAME_B',
  DeclineGame = 'DECLINE_GAME_B',
  WaitForFunding = 'WAIT_FOR_FUNDING',
  WaitForPostFundSetup = 'WAIT_FOR_POST_FUND_SETUP',
  OsPickMove = 'Os_PICK_MOVE',
  XsPickMove = 'Xs_PICK_MOVE',
  OsWaitForOpponentToPickMove = 'Os_WAIT_FOR_OPPONENT_TO_PICK_MOVE',
  XsWaitForOpponentToPickMove = 'Xs_WAIT_FOR_OPPONENT_TO_PICK_MOVE',
  WaitForResting = 'WAIT_FOR_RESTING',
  PlayAgain = 'PLAY_AGAIN',
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  WaitToResign = 'WAIT_TO_RESIGN',
  OpponentResigned = 'OPPONENT_RESIGNED',
  WaitForResignationAcknowledgement = 'WAIT_FOR_RESIGNATION_ACKNOWLEDGEMENT',
  GameOver = 'GAME_OVER',
  WaitForWithdrawal = 'WAIT_FOR_WITHDRAWAL',
}

export interface NoName {
  name: StateName.NoName;
  libraryAddress: string;
  myAddress: string;
}

interface NoNameParams {
  myAddress: string;
  libraryAddress: string;
  [x: string]: any;
}

export function noName(obj: NoNameParams): NoName {
  const { myAddress, libraryAddress } = obj;
  return { name: StateName.NoName, myAddress, libraryAddress };
}

export interface Lobby {
  name: StateName.Lobby;
  myName: string;
  myAddress: string;
  twitterHandle: string;
  libraryAddress: string;
}
interface LobbyParams {
  myName: string;
  twitterHandle: string;
  myAddress: string;
  libraryAddress: string;
  [x: string]: any;
}

export function lobby(obj: LobbyParams): Lobby {
  const { myName, myAddress, libraryAddress, twitterHandle } = obj;
  return { name: StateName.Lobby, myName, myAddress, libraryAddress, twitterHandle };
}

export interface CreatingOpenGame {
  name: StateName.CreatingOpenGame;
  myName: string;
  twitterHandle: string;
  myAddress: string;
  libraryAddress: string;
}

export function creatingOpenGame(obj: LobbyParams): CreatingOpenGame {
  const { myName, myAddress, libraryAddress, twitterHandle } = obj;
  return { name: StateName.CreatingOpenGame, myName, myAddress, libraryAddress, twitterHandle };
}

export interface WaitingRoom {
  name: StateName.WaitingRoom;
  myName: string;
  myAddress: string;
  twitterHandle: string;
  libraryAddress: string;
  roundBuyIn: string;
}

interface WaitingRoomParams {
  myName: string;
  roundBuyIn: string;
  myAddress: string;
  twitterHandle: string;
  libraryAddress: string;
  [x: string]: any;
}
export function waitingRoom(obj: WaitingRoomParams): WaitingRoom {
  const { myName, roundBuyIn, libraryAddress, myAddress, twitterHandle } = obj;
  return { name: StateName.WaitingRoom, myName, roundBuyIn, libraryAddress, myAddress, twitterHandle };
}

interface TwoChannel {
  libraryAddress: string;
  channelNonce: number;
  participants: [string, string];
}

interface Base extends TwoChannel {
  turnNum: number;
  balances: [string, string];
  stateCount: number;
  twitterHandle: string;
  roundBuyIn: string;
  myName: string;
  opponentName: string;
}

interface IncludesBase extends Base {
  [x: string]: any;
}

export function base(state: IncludesBase) {
  const {
    libraryAddress,
    channelNonce,
    participants,
    turnNum,
    balances,
    stateCount,
    roundBuyIn,
    myName,
    opponentName,
    twitterHandle,
    player,
  } = state;

  return {
    libraryAddress,
    channelNonce,
    participants,
    turnNum,
    balances,
    stateCount,
    roundBuyIn,
    myName,
    twitterHandle,
    opponentName,
    player,
  };
}

export function getOpponentAddress(state: IncludesBase) {
  return state.participants[1 - state.player];
}

export interface WaitForGameConfirmationA extends Base {
  name: StateName.WaitForGameConfirmationA;
  player: Player.PlayerA;
}
export function waitForGameConfirmationA(state: IncludesBase): WaitForGameConfirmationA {
  return { ...base(state), name: StateName.WaitForGameConfirmationA, player: Player.PlayerA };
}

export interface ConfirmGameB extends Base {
  name: StateName.ConfirmGameB;
  player: Player.PlayerB;
}
export function confirmGameB(state: IncludesBase): ConfirmGameB {
  return { ...base(state), name: StateName.ConfirmGameB, player: Player.PlayerB };
}

export interface DeclineGameB extends Base {
  name: StateName.DeclineGame;
  player: Player.PlayerB;
}
export function declineGameB(state: IncludesBase): DeclineGameB {
  return { ...base(state), name: StateName.DeclineGame, player: Player.PlayerB };
}


export interface WaitForFunding extends Base {
  name: StateName.WaitForFunding;
  player: Player;
}
export function waitForFunding(state: IncludesBase): WaitForFunding {
  return { ...base(state), name: StateName.WaitForFunding };
}

export interface WaitForPostFundSetup extends Base {
  name: StateName.WaitForPostFundSetup;
  player: Player;
}
export function waitForPostFundSetup(state: IncludesBase): WaitForPostFundSetup {
  return { ...base(state), name: StateName.WaitForPostFundSetup };
}

export interface OsPickMove extends Base {
  name: StateName.OsPickMove;
  player: Player;
}
export function osPickMove(state: IncludesBase): OsPickMove {
  return { ...base(state), name: StateName.OsPickMove };
}
export interface XsPickMove extends Base {
  name: StateName.XsPickMove;
  player: Player;
}
export function xsPickMove(state: IncludesBase): XsPickMove {
  return { ...base(state), name: StateName.XsPickMove };
}

export interface OsWaitForOpponentToPickMove extends Base {
  name: StateName.OsWaitForOpponentToPickMove;
  myMarks: Marks;
  player: Player;
}
export function osWaitForOpponentToPickMove(state: IncludesBase): OsWaitForOpponentToPickMove {
  return {
    ...base(state),
    name: StateName.OsWaitForOpponentToPickMove,
    myMarks: state.myMarks,
  };
}

export interface XsWaitForOpponentToPickMove extends Base {
  name: StateName.XsWaitForOpponentToPickMove;
  myMarks: Marks;
  player: Player;
}
export function xsWaitForOpponentToPickMove(state: IncludesBase): XsWaitForOpponentToPickMove {
  return {
    ...base(state),
    name: StateName.XsWaitForOpponentToPickMove,
    myMarks: state.myMarks,
  };
}

// interface IncludesMarks extends IncludesBase {
//   myMarks: Marks;
// }

interface IncludesResult extends IncludesBase {
  myMarks: Marks;
  theirMarks: Marks;
  result: Result;
}

export interface PlayAgain extends Base {
  name: StateName.PlayAgain;
  myMarks: Marks;
  theirMarks: Marks;
  result: Result;
  player: Player;
}
export function playAgain(state: IncludesResult): PlayAgain {
  const { myMarks, theirMarks, result } = state;
  return { ...base(state), name: StateName.PlayAgain, myMarks, theirMarks, result };
}

export interface WaitForResting extends Base {
  name: StateName.WaitForResting;
  myMarks: Marks;
  theirMarks: Marks;
  result: Result;
  player: Player.PlayerA;
}
export function waitForRestingA(state: IncludesResult): WaitForResting {
  const { myMarks, theirMarks, result } = state;
  return { ...base(state), name: StateName.WaitForResting, myMarks, theirMarks, result };
}

export interface InsufficientFunds extends Base {
  name: StateName.InsufficientFunds;
  myMarks: Marks;
  theirMarks: Marks;
  result: Result;
  player: Player;
}
export function insufficientFunds(state: IncludesResult): InsufficientFunds {
  const { myMarks, theirMarks, result } = state;
  return { ...base(state), name: StateName.InsufficientFunds, myMarks, theirMarks, result };
}

export interface WaitToResign extends Base {
  name: StateName.WaitToResign;
  player: Player;
}
export function waitToResign(state: IncludesBase): WaitToResign {
  return { ...base(state), name: StateName.WaitToResign };
}

export interface OpponentResigned extends Base {
  name: StateName.OpponentResigned;
  player: Player;
}
export function opponentResigned(state: IncludesBase): OpponentResigned {
  return { ...base(state), name: StateName.OpponentResigned };
}

export interface WaitForResignationAcknowledgement extends Base {
  name: StateName.WaitForResignationAcknowledgement;
  player: Player;
}
export function waitForResignationAcknowledgement(state: IncludesBase): WaitForResignationAcknowledgement {
  return { ...base(state), name: StateName.WaitForResignationAcknowledgement };
}

export interface GameOver extends Base {
  name: StateName.GameOver;
  player: Player;
}
export function gameOver(state: IncludesBase): GameOver {
  return { ...base(state), name: StateName.GameOver };
}

export interface WaitForWithdrawal extends Base {
  name: StateName.WaitForWithdrawal;
  player: Player;
}
export function waitForWithdrawal(state: IncludesBase): WaitForWithdrawal {
  return { ...base(state), name: StateName.WaitForWithdrawal };
}

export type PlayingState = (
  | WaitForGameConfirmationA
  | ConfirmGameB
  | DeclineGameB
  | WaitForFunding
  | WaitForPostFundSetup
  | OsPickMove
  | XsPickMove
  | OsWaitForOpponentToPickMove
  | XsWaitForOpponentToPickMove
  | PlayAgain
  | WaitForResting
  | InsufficientFunds
  | WaitToResign
  | OpponentResigned
  | WaitForResignationAcknowledgement
  | GameOver
  | WaitForWithdrawal
);

export type GameState = (
  | NoName
  | Lobby
  | CreatingOpenGame
  | WaitingRoom
  | PlayingState
);
