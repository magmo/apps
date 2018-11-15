var TTT = artifacts.require("TicTacToeGame");

contract('TicTacToeGame', (accounts) => {

  before(async () => {
    TTT = await TTT.deployed();
  });

  it("Approves a winning 'marks' integer after 3 marks", async () => {
      assert.isTrue(await TTT.hasWon.call(0b111000000));
    });

  it("Approves a winning 'marks' integer after 4 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b111000010));
  });

  it("Approves a winning 'marks' integer after 5 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b111110000));
  });

  it("Rejects a non-winning 'marks' integer after 3 marks", async () => {
    assert.isFalse(await TTT.hasWon.call(0b110010000));
  });

  it("Approves disjoint noughts and crosses", async () => {
    assert.isTrue(await TTT.areDisjoint.call(0b000000111,0b111000000));
  });

  it("Rejects overlapping noughts and crosses", async () => {
    assert.isFalse(await TTT.areDisjoint.call(0b000000001,0b100000001));
  });

  it("Approves valid move", async () => {
    assert.isTrue(await TTT.madeStrictlyOneMark.call(0b000111000,0b000110000));
  });

  it("Rejects deletion of marks", async () => {
    assert.isFalse(await TTT.madeStrictlyOneMark.call(0b100000001,0b110000000));
  });

  it("Rejects double move", async () => {
    assert.isFalse(await TTT.madeStrictlyOneMark.call(0b1100000011,0b110000000));
  });

  it("Recognizes a draw", async () => {
    assert.isTrue(await TTT.isDraw.call(0b101100011,0b010011100));
  });

  it("Recognizes a draw (that should be a win for crosses)", async () => {
    assert.isTrue(await TTT.isDraw.call(0b001101110,0b110010001));
  });

  it("Rejects a non-draw", async () => {
    assert.isFalse(await TTT.isDraw.call(0b001101110,0b110010000));
  });

  it("can count the ones in a binary number", async () => {
    assert.notEqual(await TTT.popCount.call(0b111000000), 5);
  });

  it("can count the ones in a binary number", async () => {
    assert.equal(await TTT.popCount.call(0b111000010), 4);
  });
});
