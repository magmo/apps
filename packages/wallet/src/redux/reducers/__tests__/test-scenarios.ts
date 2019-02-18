import { Channel, StateType, bigNumberify, State as Commitment } from "fmg-core";

export const libraryAddress = '0x' + '1'.repeat(40);
const nonce = 4;
export const asPrivateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
export const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
export const bsPrivateKey = '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72';
export const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';
export const participants: [string, string] = [asAddress, bsAddress];
export const channel = new Channel(libraryAddress, nonce, participants);

export const channelNonce = bigNumberify(channel.channelNonce);
export const channelId = channel.id;


export const postFundCommitment1: Commitment = {
  channel,
  stateCount: bigNumberify(0),
  stateType: StateType.PostFundSetup,
  gameAttributes: '0x0',
  turnNum: bigNumberify(2),
  allocation: [bigNumberify(1), bigNumberify(1)],
  destination: participants,
};
export const postFundCommitment2: Commitment = {
  channel,
  stateCount: bigNumberify(1),
  stateType: StateType.PostFundSetup,
  gameAttributes: '0x0',
  turnNum: bigNumberify(3),
  allocation: [bigNumberify(1), bigNumberify(1)],
  destination: participants,
};
export const preFundCommitment1: Commitment = {
  channel,
  stateCount: bigNumberify(0),
  stateType: StateType.PreFundSetup,
  gameAttributes: '0x0',
  turnNum: bigNumberify(0),
  allocation: [bigNumberify(1), bigNumberify(1)],
  destination: participants,
};
export const preFundCommitment2: Commitment = {
  channel,
  stateCount: bigNumberify(1),
  stateType: StateType.PreFundSetup,
  gameAttributes: '0x0',
  turnNum: bigNumberify(1),
  allocation: [bigNumberify(1), bigNumberify(1)],
  destination: participants,
};
export const gameCommitment1: Commitment = {
  channel,
  stateCount: bigNumberify(2),
  stateType: StateType.Game,
  gameAttributes: '0x0',
  turnNum: bigNumberify(19),
  allocation: [],
  destination: [],
};
export const gameCommitment2: Commitment = {
  channel,
  stateCount: bigNumberify(2),
  stateType: StateType.Game,
  gameAttributes: '0x0',
  turnNum: bigNumberify(20),
  allocation: [],
  destination: [],
};
export const gameCommitment3: Commitment = {
  channel,
  stateCount: bigNumberify(3),
  stateType: StateType.Game,
  gameAttributes: '0x0',
  turnNum: bigNumberify(21),
  allocation: [],
  destination: [],
};
export const concludeCommitment1: Commitment = {
  channel,
  stateCount: bigNumberify(0),
  stateType: StateType.Conclude,
  gameAttributes: '0x0',
  turnNum: bigNumberify(51),
  allocation: [],
  destination: [],
};
export const concludeCommitment2: Commitment = {
  channel,
  stateCount: bigNumberify(0),
  stateType: StateType.Conclude,
  gameAttributes: '0x0',
  turnNum: bigNumberify(52),
  allocation: [],
  destination: [],
};