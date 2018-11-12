var TTT = artifacts.require("TicTacToehelpers");

contract('TicTacToehelpers', (accounts) => {

  let stateContract;

  before(async () => {
    TTT = await TTT.deployed();
  });

  it("Recognizes a winning 'marks' integer after 3 marks", async () => {
      assert.isTrue(await TTT.hasWon.call(0b111000000));
    });

  it("Recognizes a winning 'marks' integer after 4 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b111000010));
  });

  it("Recognizes a winning 'marks' integer after 5 marks", async () => {
    assert.isTrue(await TTT.hasWon.call(0b111110000));
  });

  it("Rejects a non-winning 'marks' integer after 3 marks", async () => {
    assert.isFalse(await TTT.hasWon.call(0b110010000));
  });

  it("Recognizes disjoint noughts and crosses", async () => {
    assert.isTrue(await TTT.areDisjoint.call(0b000000111,0b111000000));
  });

  it("Rejects overlapping noughts and crosses", async () => {
    assert.isFalse(await TTT.areDisjoint.call(0b000000001,0b100000001));
  });

  it("Recognizes valid move", async () => {
    assert.isTrue(await TTT.madeStrictlyOneMark.call(0b000110000,0b000111000));
  });

  it("Rejects deletion of marks", async () => {
    assert.isFalse(await TTT.madeStrictlyOneMark.call(0b100000001,0b110000000));
  });
});

/* IN truffle develop console: truffle deploy, followed by TicTacToehelpers.at("0xa4392264a2d8c998901d10c154c91725b1bf0158").hasWon(0b111000000) returns  true */