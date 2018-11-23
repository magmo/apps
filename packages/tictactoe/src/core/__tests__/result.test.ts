import { Player } from '../players';
// import { Move } from '../moves';
import {
  Result,
  calculateResult,
  calculateAbsoluteResult,
  convertToAbsoluteResult,
  convertToRelativeResult,
} from '../results';

function testOutcome(yourMarks: number, theirMarks: number, yourVictoryClaim: boolean, theirVictoryClaim: boolean,  expectedResult: Result) {
  describe(`When you play ${yourMarks} and they play ${theirMarks}`, () => {
    const relativeResultFromMoves = calculateResult(yourMarks, theirMarks, yourVictoryClaim, theirVictoryClaim);

    it(`result gives ${Result[expectedResult]}`, () => {
      expect(relativeResultFromMoves).toEqual(expectedResult);
    });

    describe('when you are player A', () => {
      const absoluteResultFromMoves = calculateAbsoluteResult(yourMarks, theirMarks, yourVictoryClaim, theirVictoryClaim);

      const relativeResultFromAbsolute = convertToRelativeResult(absoluteResultFromMoves, Player.PlayerA);
      const absoluteResultFromRelative = convertToAbsoluteResult(relativeResultFromMoves, Player.PlayerA);

      it('relativeResult is consistent with calculateAbsoluteResult', () => {
        expect(relativeResultFromMoves).toEqual(relativeResultFromAbsolute);
      });

      it('absoluteResult is consistent with calculateResult', () => {
        expect(absoluteResultFromRelative).toEqual(absoluteResultFromMoves);
      });
    });

    describe('when you are player B', () => {
      const absoluteResultFromMoves = calculateAbsoluteResult(theirMarks, yourMarks, theirVictoryClaim, yourVictoryClaim); //note interchange of you and them

      const relativeResultFromAbsolute = convertToRelativeResult(absoluteResultFromMoves, Player.PlayerB);
      const absoluteResultFromRelative = convertToAbsoluteResult(relativeResultFromMoves, Player.PlayerB);

      it('relativeResult is consistent with calculateAbsoluteResult', () => {
        expect(relativeResultFromMoves).toEqual(relativeResultFromAbsolute);
      });

      it('absoluteResult is consistent with calculateResult', () => {
        expect(absoluteResultFromRelative).toEqual(absoluteResultFromMoves);
      });
    });
  });
}

describe('result', () => {
  testOutcome(0b000111000, 0b101000100, true, false, Result.YouWin);
  // testOutcome(Move.Rock, Move.Paper, Result.YouLose);
  // testOutcome(Move.Rock, Move.Scissors, Result.YouWin);
  // testOutcome(Move.Paper, Move.Rock, Result.YouWin);
  // testOutcome(Move.Paper, Move.Paper, Result.Tie);
  // testOutcome(Move.Paper, Move.Scissors, Result.YouLose);
  // testOutcome(Move.Scissors, Move.Rock, Result.YouLose);
  // testOutcome(Move.Scissors, Move.Paper, Result.YouWin);
  // testOutcome(Move.Scissors, Move.Scissors, Result.Tie);
});
