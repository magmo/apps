
import BN from 'bn.js'; 

// note that we are only interested in the results once we are in the draw (full board) or victory states. 
export enum Marker {
  noughts,
  crosses,
}

export enum Result {
  Tie,
  YouWin,
  YouLose,
}

export enum AbsoluteResult {
  Tie,
  NoughtsWins,
  CrossesWins,
}

export enum SingleMarks {
  tl = 1 << 8,
  tm = 1 << 7,
  tr = 1 << 6,

  ml = 1 << 5,
  mm = 1 << 4,
  mr = 1 << 3,

  bl = 1 << 2,
  bm = 1 << 1,
  br = 1 << 0,

  nn = 0
}

export type Marks = SingleMarks | SingleMarks;  // union type (not sure if this is doing anything uesful...)


export const topRow = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b111000000 = 448 mask for win @ row 1 */
export const midRow = (SingleMarks.ml | SingleMarks.mm | SingleMarks.mr); /*  0b000111000 =  56 mask for win @ row 2 */
export const botRow = (SingleMarks.bl | SingleMarks.bm | SingleMarks.br); /*  0b000000111 =   7 mask for win @ row 3 */

export const lefCol = (SingleMarks.tl | SingleMarks.ml | SingleMarks.bl); /*  0b100100100 = 292 mask for win @ col 1 */
export const midCol = (SingleMarks.tm | SingleMarks.mm | SingleMarks.bm); /*  0b010010010 = 146 mask for win @ col 2 */
export const rigCol = (SingleMarks.tr | SingleMarks.mr | SingleMarks.br); /*  0b001001001 =  73 mask for win @ col 3 */

export const dhDiag = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b100010001 = 273 mask for win @ downhill diag */
export const uhDiag = (SingleMarks.tl | SingleMarks.tm | SingleMarks.tr); /*  0b001010100 =  84 mask for win @ uphill diag */

export const fullBd = (topRow | midRow | botRow); /* 0b111111111 = 511 full board */

export function isWinningMarks(marks: Marks): boolean{
  return  (
    ((marks & topRow) == topRow) ||
    ((marks & midRow) == midRow) ||
    ((marks & botRow) == botRow) ||
    ((marks & lefCol) == lefCol) ||
    ((marks & midCol) == midCol) ||
    ((marks & rigCol) == rigCol) ||
    ((marks & dhDiag) == dhDiag) ||
    ((marks & uhDiag) == uhDiag) 
  );
}

export function isDraw(noughts: Marks, crosses: Marks): boolean{
  if((noughts ^ crosses) == fullBd) { 
      return true; // using XOR. Note that a draw could include a winning position that is unnoticed / unclaimed
  }
  else return false;
}


export function calculateResult(noughts: Marks, crosses: Marks, you: Marker): Result {
  if (isWinningMarks(crosses)) {  // crosses takes precedence, since they always move first. 
    if (you == Marker.crosses) return Result.YouWin;
    else return Result.YouLose;
  }
  else if (isWinningMarks(noughts)) {
    if (you == Marker.noughts) return Result.YouWin;
    else return Result.YouLose;
  }
  else return Result.Tie;
}

export function calculateAbsoluteResult(noughts: Marks, crosses: Marks): AbsoluteResult {
  if (isWinningMarks(crosses)) { 
    return AbsoluteResult.CrossesWins;
  }
  else if (isWinningMarks(noughts)) {
    return AbsoluteResult.NoughtsWins;
  }
  else return AbsoluteResult.Tie;
}


export function convertToAbsoluteResult(relativeResult: Result, you: Marker): AbsoluteResult {
  switch(relativeResult) {
    case Result.Tie:
      return AbsoluteResult.Tie;
    case Result.YouWin:
      return you == Marker.crosses ? AbsoluteResult.CrossesWins : AbsoluteResult.NoughtsWins; //conditional type
    case Result.YouLose:
      return you == Marker.crosses ? AbsoluteResult.NoughtsWins : AbsoluteResult.CrossesWins;
  }
}

export function convertToRelativeResult(absoluteResult: AbsoluteResult, you: Marker): Result {
  switch(absoluteResult) {
    case AbsoluteResult.Tie:
      return Result.Tie;
    case AbsoluteResult.NoughtsWins:
      return you == Marker.crosses ? Result.YouLose : Result.YouWin;
    case AbsoluteResult.CrossesWins:
      return you == Marker.crosses ? Result.YouWin : Result.YouLose;
  }
}

export function balancesAfterResult(absoluteResult: AbsoluteResult, you: Marker, roundBuyIn: BN, balances: [BN, BN]): [BN, BN] {
  switch(absoluteResult) {
    case AbsoluteResult.NoughtsWins:
      if (you == Marker.noughts) return [ balances[0].add(roundBuyIn.muln(2)), balances[1].sub(roundBuyIn.muln(2)) ];
      else return [ balances[0].add(roundBuyIn.muln(1)), balances[1].sub(roundBuyIn.muln(1)) ];
    case AbsoluteResult.CrossesWins:
      return balances;
    case AbsoluteResult.Tie:
      if (you == Marker.noughts) return [ balances[0].add(roundBuyIn.muln(2)), balances[1].sub(roundBuyIn.muln(2)) ];
      else return [ balances[0].add(roundBuyIn.muln(1)), balances[1].sub(roundBuyIn.muln(1)) ];
  }
}