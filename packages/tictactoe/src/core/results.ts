
import BN from 'bn.js'; 

// note that we are only interested in the results once we are in the draw (full board) or victory states. 
export enum Marks {
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

const topRow: number = 448; /*  0b111000000 = 448 mask for win @ row 1 */
const midRow: number =  56; /*  0b000111000 =  56 mask for win @ row 2 */
const botRow: number =   7; /*  0b000000111 =   7 mask for win @ row 3 */
const lefCol: number = 292; /*  0b100100100 = 292 mask for win @ col 1 */
const midCol: number = 146; /*  0b010010010 = 146 mask for win @ col 2 */
const rigCol: number =  73; /*  0b001001001 =  73 mask for win @ col 3 */
const dhDiag: number = 273; /*  0b100010001 = 273 mask for win @ downhill diag */
const uhDiag: number =  84; /*  0b001010100 =  84 mask for win @ uphill diag */
//
const fullBd: number = 511; /* 0b111111111 = 511 full board */

export function isWinningMarks(marks: number): boolean{
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

export function isDraw(noughts: number, crosses: number): boolean{
  if((noughts ^ crosses) == fullBd) { 
      return true; // using XOR. Note that a draw could include a winning position that is unnoticed / unclaimed
  }
  else return false;
}


export function calculateResult(noughts: number, crosses: number, you: Marks): Result {
  if (isWinningMarks(crosses)) {  // crosses takes precedence, since they always move first. 
    if (you == Marks.crosses) return Result.YouWin;
    else return Result.YouLose;
  }
  else if (isWinningMarks(noughts)) {
    if (you == Marks.noughts) return Result.YouWin;
    else return Result.YouLose;
  }
  else return Result.Tie;
}

export function calculateAbsoluteResult(noughts: number, crosses: number): AbsoluteResult {
  if (isWinningMarks(crosses)) { 
    return AbsoluteResult.CrossesWins;
  }
  else if (isWinningMarks(noughts)) {
    return AbsoluteResult.NoughtsWins;
  }
  else return AbsoluteResult.Tie;
}


export function convertToAbsoluteResult(relativeResult: Result, you: Marks): AbsoluteResult {
  switch(relativeResult) {
    case Result.Tie:
      return AbsoluteResult.Tie;
    case Result.YouWin:
      return you == Marks.crosses ? AbsoluteResult.CrossesWins : AbsoluteResult.NoughtsWins; //conditional type
    case Result.YouLose:
      return you == Marks.crosses ? AbsoluteResult.NoughtsWins : AbsoluteResult.CrossesWins;
  }
}

export function convertToRelativeResult(absoluteResult: AbsoluteResult, you: Marks): Result {
  switch(absoluteResult) {
    case AbsoluteResult.Tie:
      return Result.Tie;
    case AbsoluteResult.NoughtsWins:
      return you == Marks.crosses ? Result.YouLose : Result.YouWin;
    case AbsoluteResult.CrossesWins:
      return you == Marks.crosses ? Result.YouWin : Result.YouLose;
  }
}

export function balancesAfterResult(absoluteResult: AbsoluteResult, you: Marks, roundBuyIn: BN, balances: [BN, BN]): [BN, BN] {
  switch(absoluteResult) {
    case AbsoluteResult.NoughtsWins:
      if (you == Marks.noughts) return [ balances[0].add(roundBuyIn.muln(2)), balances[1].sub(roundBuyIn.muln(2)) ];
      else return [ balances[0].add(roundBuyIn.muln(1)), balances[1].sub(roundBuyIn.muln(1)) ];
    case AbsoluteResult.CrossesWins:
      return balances;
    case AbsoluteResult.Tie:
      if (you == Marks.noughts) return [ balances[0].add(roundBuyIn.muln(2)), balances[1].sub(roundBuyIn.muln(2)) ];
      else return [ balances[0].add(roundBuyIn.muln(1)), balances[1].sub(roundBuyIn.muln(1)) ];
  }
}

// TODO no default case here?