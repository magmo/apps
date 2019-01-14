import BN from "bn.js";
import { Move } from './moves';
import { Result } from './results';
import * as positions from './positions';
import { randomHex, bnToHex } from "../test-utils";

import { Channel } from "fmg-core";

const libraryAddress = '0x' + '1'.repeat(40);
const channelNonce = 4;
const asPrivateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
const bsPrivateKey = '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72';
const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';
const participants: [string, string] = [asAddress, bsAddress];
const roundBuyIn = bnToHex(new BN(1));
const fiveFive = [new BN(5), new BN(5)].map(bnToHex) as [string, string];
const sixFour = [new BN(6), new BN(4)].map(bnToHex) as [string, string];
const fourSix = [new BN(4), new BN(6)].map(bnToHex) as [string, string];
const nineOne = [new BN(9), new BN(1)].map(bnToHex) as [string, string];
const eightTwo = [new BN(8), new BN(2)].map(bnToHex) as [string, string];
const tenZero = [new BN(10), new BN(0)].map(bnToHex) as [string, string];
const asMove = Move.Rock;
const salt = randomHex(64);
const preCommit = positions.hashCommitment(asMove, salt);
const bsMove = Move.Scissors;

const channelId = new Channel(libraryAddress, channelNonce, participants).id;

const base = {
  channelId,
  libraryAddress,
  channelNonce,
  participants,
  roundBuyIn,
};

const shared = {
  ...base,
  asAddress,
  twitterHandle: "twtr",
  bsAddress,
  myName: 'Tom',
  opponentName: 'Alex',
  asPrivateKey,
  bsPrivateKey,
};

export const standard = {
  ...shared,
  preFundSetupA: positions.preFundSetupA({ ...base, turnNum: 0, balances: fiveFive, stateCount: 0 }),
  preFundSetupB: positions.preFundSetupB({ ...base, turnNum: 1, balances: fiveFive, stateCount: 1 }),
  postFundSetupA: positions.postFundSetupA({ ...base, turnNum: 2, balances: fiveFive, stateCount: 0 }),
  postFundSetupB: positions.postFundSetupB({ ...base, turnNum: 3, balances: fiveFive, stateCount: 1 }),
  asMove,
  salt,
  preCommit,
  bsMove,
  aResult: Result.YouWin,
  bResult: Result.YouLose,
  propose: positions.proposeFromSalt({ ...base, turnNum: 4, balances: fiveFive, asMove, salt }),
  accept: positions.accept({ ...base, turnNum: 5, balances: fourSix, preCommit, bsMove }),
  reveal: positions.reveal({ ...base, turnNum: 6, balances: sixFour, bsMove, asMove, salt }),

  preFundSetupAHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  preFundSetupASig: '0xe08144da0aa0a49be55e6ace7143702be8f4929559af6f3f7e7530912785c1aa173f9bb2c013e86c2a5a40b225adbb07891ccb613a921396a2f2478741dbf3611c',
  preFundSetupBHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  preFundSetupBSig: '0x1ed105fe82e2c071a7d4c9c7c9a1f22b6b5f469c71d14b6d29c4a189b1f2e7d763d9fb0575689c70c956331e77e28ef04b25105173f969d744351a3ff56417691b',
  postFundSetupAHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  postFundSetupASig: '0x146fc6085a1d26f5550c88d0a082aa39613891e8500b9758a135d6bec7310df945e1bd82596f620e8865ae84427948a2cf2793c2da2d18797c5c6022824e5cab1c',
  postFundSetupBHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  postFundSetupBSig: '0x367289f2e5e39aed1f5e6531bda23b38b285b3be59bce82193c0cae1087e7e6258052bd98d53c0d52aeb67efefeac0c90e783ca285f686756ade3db8b26b7edf1c',
  proposeHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001f5cafdccc1599ae1d89b67782e35207b00705758e1d33365035bda45562f9663',
  proposeSig: '0xc6c5645ecec370fcd289f61a2edbe2deee83b7a9286c591f2e9b584135bb518f5c03acffcdfa96288ccadece8dff1ea1e13c8b383ac0fabe122174d82f015db41c',
  acceptHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001f5cafdccc1599ae1d89b67782e35207b00705758e1d33365035bda45562f96630000000000000000000000000000000000000000000000000000000000000002',
  acceptSig: '0x6d42f71b1b2476c160aa47bfc442e00f58317110ba5ec50472bd10fc419aa1e11427d24fd9a2f34870faa41b763c6fd6a667359c221e10736132efd3d62051ee1b',
  revealHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004444444444444444444444444444444444444444444444444444444444444444',
  revealSig: '0xf6eb5279c1f3afdcd210e94b61af721bbad7dac7fd5d5cb40debe0aa40fb92d12af781e958e4b87355c724ab94286db8fe8fb0b25227ac42654ba3a8933bddb61b',
};

export const aResignsAfterOneRound = {
  ...standard,
  resting: positions.resting({ ...base, turnNum: 7, balances: sixFour }),
  conclude: positions.conclude({ ...base, turnNum: 8, balances: sixFour }),
  conclude2: positions.conclude({ ...base, turnNum: 9, balances: sixFour }),
  restingHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  restingSig: '0xaad2107ef36e03cbbd94123937ee73f3fea31ea36d4f15467656a67a32c09e844ea3cb51830619eb38c3ed944f645afcbab422bf2a13c9516e63b27210c5ea1d1c',
  concludeHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  conclude2Hex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000009000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  conclude2Sig: '0xc7734c1cf0d2988fb7ea2caff803d403e5fc7148f792e184fea521e600fa8e4a1f857a626298949d2ffb10111672e1e283bb3a45a6c77c9e388dc7784be94ceb1c',
};

export const bResignsAfterOneRound = {
  ...standard,
  conclude: positions.conclude({ ...base, turnNum: 7, balances: sixFour }),
  concludeHex: '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  concludeSig: '0xee40164052e7f409acd840ac099eee45ec233e068fb5b883e6871ea6d1e3b1516c7b4f7b587844b87ec20191daf2f891b81758db23481b2777bae653748efbf61b',
  conclude2: positions.conclude({ ...base, turnNum: 8, balances: sixFour }),
};

export const insufficientFunds = {
  preFundSetupA: positions.preFundSetupB({ ...base, turnNum: 0, balances: nineOne, stateCount: 0 }),
  preFundSetupB: positions.preFundSetupB({ ...base, turnNum: 1, balances: nineOne, stateCount: 1 }),
  postFundSetupA: positions.postFundSetupA({ ...base, turnNum: 2, balances: nineOne, stateCount: 0 }),
  postFundSetupB: positions.postFundSetupB({ ...base, turnNum: 3, balances: nineOne, stateCount: 1 }),
  asMove,
  bsMove,
  propose: positions.proposeFromSalt({ ...base, turnNum: 4, balances: nineOne, asMove, salt }),
  accept: positions.accept({ ...base, turnNum: 5, balances: eightTwo, preCommit, bsMove }),
  reveal: positions.reveal({ ...base, turnNum: 6, balances: tenZero, bsMove, asMove, salt }),
  conclude: positions.conclude({ ...base, turnNum: 7, balances: tenZero }),
  conclude2: positions.conclude({ ...base, turnNum: 8, balances: tenZero }),
};

export function build(customLibraryAddress: string, customAsAddress: string, customBsAddress: string) {
  const customParticipants: [string, string] = [customAsAddress, customBsAddress];
  const customBase = {
    libraryAddress: customLibraryAddress,
    channelNonce,
    participants: customParticipants,
    roundBuyIn,
  };

  const customShared = {
    ...customBase,
    asAddress: customAsAddress,
    bsAddress: customBsAddress,
    myName: 'Tom',
    opponentName: 'Alex',
  };

  return {
    ...customShared,
    preFundSetupA: positions.preFundSetupA({ ...base, turnNum: 0, balances: fiveFive, stateCount: 0 }),
    preFundSetupB: positions.preFundSetupB({ ...base, turnNum: 1, balances: fiveFive, stateCount: 1 }),
    postFundSetupA: positions.postFundSetupA({ ...base, turnNum: 2, balances: fiveFive, stateCount: 0 }),
    postFundSetupB: positions.postFundSetupB({ ...base, turnNum: 3, balances: fiveFive, stateCount: 1 }),
    asMove,
    salt,
    preCommit,
    bsMove,
    aResult: Result.YouWin,
    bResult: Result.YouLose,
    propose: positions.proposeFromSalt({ ...base, turnNum: 4, balances: fiveFive, asMove, salt }),
    accept: positions.accept({ ...base, turnNum: 5, balances: fourSix, preCommit, bsMove }),
    reveal: positions.reveal({ ...base, turnNum: 6, balances: sixFour, bsMove, asMove, salt }),
    resting: positions.resting({ ...base, turnNum: 7, balances: sixFour }),
  };
}
