// import { Marks } from './marks';
import { Player } from './players';
import BN from 'bn.js'; // TODO troubleshoot this. Need to add @types to project? yarn add @types/node ?

export enum Result {
  Tie,
  YouWin,
  YouLose,
}

export enum AbsoluteResult {
  Tie,
  AWins,
  BWins,
}

const topRow: number = 448; /*  0b111000000 = 448 mask for win @ row 1 */
const midRow: number =  56; /*  0b000111000 =  56 mask for win @ row 2 */
const botRow: number =   7; /*  0b000000111 =   7 mask for win @ row 3 */
const lefCol: number = 292; /*  0b100100100 = 292 mask for win @ col 1 */
const midCol: number = 146; /*  0b010010010 = 146 mask for win @ col 2 */
const rigCol: number =  73; /*  0b001001001 =  73 mask for win @ col 3 */
const dhDiag: number = 273; /*  0b100010001 = 273 mask for win @ downhill diag */
const uhDiag: number =  84; /*  0b001010100 =  84 mask for win @ uphill diag */
//
// const fullBd: number = 511; /* 0b111111111 = 511 full board */

export function isWinningMarks(marks: number){
  return  (
    ((marks & topRow) == topRow) ||
    ((marks & midRow) == midRow) ||
    ((marks & botRow) == botRow) ||
    ((marks & lefCol) == lefCol) ||
    ((marks & midCol) == midCol) ||
    ((marks & rigCol) == rigCol) ||
    ((marks & dhDiag) == dhDiag) ||
    ((marks & uhDiag) == uhDiag) 
  )
}

export function calculateResult(yourMarks: number, theirMarks: number, yourVictoryClaim: boolean, theirVictoryClaim: boolean): Result {
  if (yourVictoryClaim && !theirVictoryClaim && isWinningMarks(yourMarks)) {
    return Result.YouWin;
  }
  else if (!yourVictoryClaim && theirVictoryClaim && isWinningMarks(theirMarks)) { 
    return Result.YouLose;
  }
  else {
    return Result.Tie;
  }
}

export function calculateAbsoluteResult(asMarks: number, bsMarks: number, asVictoryClaim: boolean, bsVictoryClaim: boolean): AbsoluteResult {
  if (asVictoryClaim && !bsVictoryClaim && isWinningMarks(asMarks)) {
    return AbsoluteResult.AWins;
  }
  else if (!asVictoryClaim && bsVictoryClaim && isWinningMarks(bsMarks)) { 
    return AbsoluteResult.BWins;
  }
  else {
    return AbsoluteResult.Tie;
  }
}


export function convertToAbsoluteResult(relativeResult: Result, youAre: Player) {
  const youArePlayerA = youAre === Player.PlayerA;

  switch(relativeResult) {
    case Result.Tie:
      return AbsoluteResult.Tie;
    case Result.YouWin:
      return youArePlayerA ? AbsoluteResult.AWins : AbsoluteResult.BWins;
    case Result.YouLose:
      return youArePlayerA ? AbsoluteResult.BWins : AbsoluteResult.AWins;
  }
}

export function convertToRelativeResult(absoluteResult: AbsoluteResult, youAre: Player): Result {
  const youArePlayerA = youAre === Player.PlayerA;

  switch(absoluteResult) {
    case AbsoluteResult.Tie:
      return Result.Tie;
    case AbsoluteResult.AWins:
      return youArePlayerA ? Result.YouWin : Result.YouLose;
    case AbsoluteResult.BWins:
      return youArePlayerA ? Result.YouLose : Result.YouWin;
  }

}

export function balancesAfterResult(absoluteResult: AbsoluteResult, roundBuyIn: BN, balances: [BN, BN]): [BN, BN] {
  switch(absoluteResult) {
    case AbsoluteResult.AWins:
      return [ balances[0].add(roundBuyIn.muln(2)), balances[1].sub(roundBuyIn.muln(2)) ];
    case AbsoluteResult.BWins:
      return balances;
    case AbsoluteResult.Tie:
      return [ balances[0].add(roundBuyIn.muln(1)), balances[1].sub(roundBuyIn.muln(1)) ];
  }
}
