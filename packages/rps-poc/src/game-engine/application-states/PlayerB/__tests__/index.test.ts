import { Channel } from 'fmg-core';
import * as AppStates from '..';
import { Play, Result, PreFundSetup } from '../../../positions';

const gameLibrary = '0xc1912fee45d61c87cc5ea59dae31190fffff232d';
const channelNonce = 15;
const participantA = '0xc1912fee45d61c87cc5ea59dae31190fffff232d';
const participantB = '0xc1912fee45d61c87cc5ea59dae31190fffff232d';
const participants = [participantA, participantB];
const channel = new Channel(gameLibrary, channelNonce, participants);
const stake = 1;
const aBal = 4;
const bBal = 5
const balances = [aBal, bBal];
const coreProps = { channel, stake, balances };
const adjudicator = 0xc;
const aPlay = Play.Rock;
const bPlay = Play.Scissors;
const salt = "abc123";
const position = new PreFundSetup(channel, 0, balances, 0, stake);
const result = Result.YouWin;

const itHasSharedFunctionality = (appState) => {
  it("returns myAddress", () => {
    expect(appState.myAddress).toEqual(participantB);
  });

  it("returns opponentAddress", () => {
    expect(appState.opponentAddress).toEqual(participantA);
  });

  it("returns channelId", () => {
    expect(appState.channelId).toEqual(channel.id);
  });

  it("returns myBalance", () => {
    expect(appState.myBalance).toEqual(bBal);
  });

  it("returns opponentBalance", () => {
    expect(appState.opponentBalance).toEqual(aBal);
  });
};

describe("ReadyToSendPreFundSetupB", () => {
  const appState = new AppStates.ReadyToSendPreFundSetupB({ ...coreProps, position });

  itHasSharedFunctionality(appState);

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});


describe("WaitForPostFundSetupA", () => {
  const appState = new AppStates.WaitForPostFundSetupA({ ...coreProps, adjudicator });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });
});

describe("ReadyToSendPostFundSetupB", () => {
  const appState = new AppStates.ReadyToSendPostFundSetupB({
    ...coreProps,
    adjudicator,
    position,
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});

describe("WaitForPropose", () => {
  const appState = new AppStates.WaitForPropose({
    ...coreProps,
    adjudicator,
    position,
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});

describe("ReadyToChooseBPlay", () => {
  const appState = new AppStates.ReadyToChooseBPlay({
    ...coreProps,
    adjudicator,
    turnNum: 4,
    preCommit: '0xaaa',
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });
});

describe("ReadyToSendAccept", () => {
  const appState = new AppStates.ReadyToSendAccept({
    ...coreProps,
    adjudicator,
    bPlay,
    position,
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });

  it("returns b's play", () => {
    expect(appState.bPlay).toEqual(bPlay);
  });

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});

describe("WaitForReveal", () => {
  const appState = new AppStates.WaitForReveal({
    ...coreProps,
    adjudicator,
    bPlay,
    position,
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });

  it("returns b's play", () => {
    expect(appState.bPlay).toEqual(bPlay);
  });

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});

describe("ReadyToSendResting", () => {
  const appState = new AppStates.ReadyToSendResting({
    ...coreProps,
    adjudicator,
    bPlay,
    aPlay,
    salt,
    result,
    position,
  });

  itHasSharedFunctionality(appState);

  it("returns the address of the adjudicator", () => {
    expect(appState.adjudicator).toEqual(adjudicator);
  });

  it("returns b's play", () => {
    expect(appState.bPlay).toEqual(bPlay);
  });

  it("returns a's play", () => {
    expect(appState.aPlay).toEqual(aPlay);
  });

  it("returns the salt", () => {
    expect(appState.aPlay).toEqual(aPlay);
  });

  it("returns the result", () => {
    expect(appState.result).toEqual(result);
  });

  it("has a position", () => {
    expect(appState.position).toEqual(position);
  });
});
