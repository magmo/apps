// import { Player } from '../players';
// import { Move } from '../moves';
import {
  Result,
  calculateResult,
  calculateAbsoluteResult,
  convertToAbsoluteResult,
  convertToRelativeResult,
} from '../results';

function testOutcome(noughts: number, crosses: number, you: string, expectedResult: Result) {
  var description: string;
  switch(you) {
    case "noughts": {description = `When you play noughts = ${noughts} and crosses = ${crosses}`}; break;
    case "crosses": {description = `When noughts = ${noughts} and you play crosses = ${crosses}`}; break;
    default: description = 'you are not being parsed!!';
  }
  describe(description, () => {
    
    const relativeResultFromMoves = calculateResult(noughts, crosses, you);

    it(`result gives ${Result[expectedResult]}`, () => {
      expect(relativeResultFromMoves).toEqual(expectedResult);
    });

    const absoluteResultFromMoves = calculateAbsoluteResult(noughts, crosses);

    const relativeResultFromAbsolute = convertToRelativeResult(absoluteResultFromMoves, you);
    const absoluteResultFromRelative = convertToAbsoluteResult(relativeResultFromMoves, you);

    it('relativeResult is consistent with calculateAbsoluteResult', () => {
      expect(relativeResultFromMoves).toEqual(relativeResultFromAbsolute);
    });

    it('absoluteResult is consistent with calculateResult', () => {
      expect(absoluteResultFromRelative).toEqual(absoluteResultFromMoves);
    });
  });
}

describe('result', () => {
  testOutcome(0b000111000, 0b101000100, "noughts", Result.YouWin);
  testOutcome(0b001110010, 0b110001101, "noughts", Result.Tie);
  testOutcome(0b001110010, 0b110001101, "crosses", Result.Tie);
  testOutcome(0b100000000, 0b111101010, "crosses", Result.YouWin);
  testOutcome(0b100000000, 0b111101010, "noughts", Result.YouLose);
})
