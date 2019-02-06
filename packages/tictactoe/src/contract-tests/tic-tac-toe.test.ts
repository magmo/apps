import { scenarios, encode } from '../core';
import { ethers } from 'ethers';
import TTTGameArtifact from "../../build/contracts/TicTacToeGame.json";

jest.setTimeout(20000);

describe('TicTacToeGame', () => {
  let tttContract;  
  let playing1;
  let playing2;
  let playing3;
  let playing4;
  let playing5;
  let playing6;
  let playing7;
  let playing8;
  let draw;
  let againMF;
  let againMS;

  let networkId;
  const provider = new ethers.providers.JsonRpcProvider(`http://localhost:${process.env.DEV_GANACHE_PORT}`);

  beforeEach(async () => {
    networkId = (await provider.getNetwork()).chainId;
    const libraryAddress = TTTGameArtifact.networks[networkId].address;

    tttContract = new ethers.Contract(libraryAddress, TTTGameArtifact.abi, provider);

    const scenario = scenarios.swapRoles;
    playing1 = scenario.playing1;
    playing2 = scenario.playing2;
    playing3 = scenario.playing3;
    playing4 = scenario.playing4;
    playing5 = scenario.playing5;
    playing6 = scenario.playing6;
    playing7 = scenario.playing7;
    playing8 = scenario.playing8;
    playing3 = scenario.playing3;
    draw     = scenario.draw;
    againMF  = scenario.againMF;
    againMS  = scenario.againMS;
  });

  const validTransition = async (state1, state2) => {
    const returnValue = await tttContract.validTransition(encode(state1), encode(state2));
    // console.log(returnValue);
    return returnValue;
  };

  // Transition function tests
  // ========================

  it("allows XPLAYING -> OPLAYING", async () => {
    expect(validTransition(playing1, playing2)).toBeTruthy();
    expect(validTransition(playing3, playing4)).toBeTruthy();
    expect(validTransition(playing5, playing6)).toBeTruthy();
    expect(validTransition(playing7, playing8)).toBeTruthy();
  });

  it("allows OPLAYING -> XPLAYING", async () => {
    expect(validTransition(playing2, playing3)).toBeTruthy();
    expect(validTransition(playing4, playing5)).toBeTruthy();
    expect(validTransition(playing6, playing7)).toBeTruthy();
  });

  it("allows OPLAYING -> DRAW", async () => {
    expect(validTransition(playing8, draw)).toBeTruthy();
  });

  it("allows PLAY_AGAIN_ME_FIRST -> PLAY_AGAIN_ME_SECOND", async () => {
    expect(validTransition(againMF, againMS)).toBeTruthy();
  });

  it("disallows PLAY_AGAIN_ME_SECOND -> PLAY_AGAIN_ME_FIRST ", async () => {
    expect.assertions(1);
    await expect(tttContract.validTransition(encode(againMS), encode(againMF))).rejects.toThrowError();
  });
});
