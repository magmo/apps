import { scenarios, encode, convertToAbsoluteResult } from '../src/core';

const TTT = artifacts.require("TicTacToeGame.sol");

contract('TicTacToeGame', (accounts) => {
  let tttContract;  
  let playing1, playing2;

  before(async () => {
    
    tttContract = await TTT.deployed();
    
    const libraryAddress = tttContract.address;

    const scenario = scenarios.build(libraryAddress, accounts[0], accounts[1]);
    
    // postFundSetupB = scenario.postFundSetupB;
    // propose = scenario.propose;
    playing1 = scenario.playing1;
    playing2 = scenario.playing2;
    // accept = scenario.accept;
    // reveal = scenario.reveal;
    // resting = scenario.resting;
  });

  const validTransition = async (state1, state2) => {
    return await tttContract.validTransition(encode(state1), encode(state2));
  };

  // Transition function tests
  // ========================


  it("allows XPLAYING -> OPLAYING", async () => {
    assert(await validTransition(playing1, playing2));
  });

  it("Approves a winning 'marks' integer after 3 marks", async () => {
      assert.isTrue(await tttContract.hasWon.call(0b111000000));
    });

  it("Approves a winning 'marks' integer after 4 marks", async () => {
    assert.isTrue(await tttContract.hasWon.call(0b111000010));
  });

  it("Approves a winning 'marks' integer after 5 marks", async () => {
    assert.isTrue(await tttContract.hasWon.call(0b111110000));
  });

  it("Rejects a non-winning 'marks' integer after 3 marks", async () => {
    assert.isFalse(await tttContract.hasWon.call(0b110010000));
  });

  it("Approves disjoint noughts and crosses", async () => {
    assert.isTrue(await tttContract.areDisjoint.call(0b000000111,0b111000000));
  });

  it("Rejects overlapping noughts and crosses", async () => {
    assert.isFalse(await tttContract.areDisjoint.call(0b000000001,0b100000001));
  });

  it("Approves valid move", async () => {
    assert.isTrue(await tttContract.madeStrictlyOneMark.call(0b000111000,0b000110000));
  });

  it("Rejects deletion of marks", async () => {
    assert.isFalse(await tttContract.madeStrictlyOneMark.call(0b100000001,0b110000000));
  });

  it("Rejects double move", async () => {
    assert.isFalse(await tttContract.madeStrictlyOneMark.call(0b1100000011,0b110000000));
  });

  it("Recognizes a draw", async () => {
    assert.isTrue(await tttContract.isDraw.call(0b101100011,0b010011100));
  });

  it("Recognizes a draw (that should be a win for crosses)", async () => {
    assert.isTrue(await tttContract.isDraw.call(0b001101110,0b110010001));
  });

  it("Rejects a non-draw", async () => {
    assert.isFalse(await tttContract.isDraw.call(0b001101110,0b110010000));
  });

  it("can count the ones in a binary number", async () => {
    assert.notEqual(await tttContract.popCount.call(0b111000000), 5);
  });

  it("can count the ones in a binary number", async () => {
    assert.equal(await tttContract.popCount.call(0b111000010), 4);
  });
});
