import { scenarios, encode } from '../src/core';

import hexToBN from '../src/utils/hexToBN';

const TTTStateContract = artifacts.require("./TicTacToeState.sol");

contract('TicTacToeState', (accounts) => {
  // Serializing / Deserializing
  // ===========================

  const scenario = scenarios.standard;
  // const propose = scenario.propose;
  // const reveal = scenario.reveal;
  const playing1 = scenario.playing1;
  const playing2 = scenario.playing2;

  let stateContract;

  before(async () => {
    stateContract = await TTTStateContract.deployed();
  });

  // // skipped because web3 can't cope with the positionType object that is returned
  // it.skip("can parse positionType", async () => {
  //   assert.equal(await stateContract.positionType(encode(reveal)), 'some type');
  // });

  it("can parse aBal", async () => {
    const val = await stateContract.aResolution(encode(playing1));
    assert(val.eq(hexToBN(playing1.balances[0])));
  });

  it("can parse bBal", async () => {
    const val = await stateContract.bResolution(encode(playing1));
    assert(val.eq(hexToBN(playing1.balances[1])));
  });

  it("can parse stake", async () => {
    const val = await stateContract.stake(encode(playing1));
    assert(val.eq(hexToBN(playing1.roundBuyIn)));
  });

  // it("can parse noughts", async () => {
  //   const val = await stateContract.noughts(encode(playing1));
  //   console.log(val);
  //   assert(val.eq(hexToBN(playing1.noughts)));
  // });

  // it("can parse crosses", async () => {
  //   const val = await stateContract.crosses(encode(playing2));
  //   console.log(val);
  //   assert(val.eq(hexToBN(playing2.crosses)));
  // });

  // it("can parse preCommit", async () => {
  //   assert.equal(await stateContract.preCommit(encode(propose)), propose.preCommit);
  // });

  // // skipped because web3 can't cope with the Play object that is returned
  // it.skip("can parse bPlay", async () => {
  //   assert.equal(await stateContract.bPlay.call(encode(reveal)), reveal.bsMove);
  // });

  // // skipped because web3 can't cope with the Play object that is returned
  // it.skip("can parse aPlay", async () => {
  //   assert.equal(await stateContract.aPlay.call(encode(reveal)), reveal.asMove);
  // });

  // it("can parse salt", async () => {
  //   assert.equal(await stateContract.salt(encode(reveal)), reveal.salt);
  // });

});
