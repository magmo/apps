import { Result } from './results';
import * as commitmentHelper from './rps-commitment-helper';
import { randomHex } from '../utils/randomHex';
import { Weapon } from './rps-commitment';
import { bigNumberify } from 'ethers/utils';
import { Channel } from 'fmg-core';

export const libraryAddress = '0x' + '1'.repeat(40);
const channelNonce = 4;
const asPrivateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
const bsPrivateKey = '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72';
const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';
const participants: [string, string] = [asAddress, bsAddress];
const roundBuyIn = bigNumberify(1).toHexString();
const fiveFive = [bigNumberify(5).toHexString(), bigNumberify(5).toHexString()] as [string, string];
const sixFour = [bigNumberify(6).toHexString(), bigNumberify(4).toHexString()] as [string, string];
const fourSix = [bigNumberify(4).toHexString(), bigNumberify(6).toHexString()] as [string, string];
const nineOne = [bigNumberify(9).toHexString(), bigNumberify(1).toHexString()] as [string, string];
const eightTwo = [bigNumberify(8).toHexString(), bigNumberify(2).toHexString()] as [string, string];
const tenZero = [bigNumberify(10).toHexString(), bigNumberify(0).toHexString()] as [string, string];
const aWeapon = Weapon.Rock;
const salt = randomHex(64);
const preCommit = commitmentHelper.hashCommitment(aWeapon, salt);
const bWeapon = Weapon.Scissors;

const channel: Channel = { channelType: libraryAddress, nonce: channelNonce, participants };

const base = {
  channel,
  destination: participants,
  commitmentCount: 0,
};

const baseWithBuyIn = {
  ...base,
  roundBuyIn,
};

export const shared = {
  ...baseWithBuyIn,
  asAddress,
  twitterHandle: 'twtr',
  bsAddress,
  myName: 'Tom',
  opponentName: 'Alex',
  asPrivateKey,
  bsPrivateKey,
};

export const standard = {
  ...shared,
  preFundSetupA: commitmentHelper.preFundSetupA({
    ...baseWithBuyIn,
    turnNum: 0,
    allocation: fiveFive,
    commitmentCount: 0,
  }),
  preFundSetupB: commitmentHelper.preFundSetupB({
    ...baseWithBuyIn,
    turnNum: 1,
    allocation: fiveFive,
    commitmentCount: 1,
  }),
  postFundSetupA: commitmentHelper.postFundSetupA({
    ...baseWithBuyIn,
    turnNum: 2,
    allocation: fiveFive,
    commitmentCount: 0,
  }),
  postFundSetupB: commitmentHelper.postFundSetupB({
    ...baseWithBuyIn,
    turnNum: 3,
    allocation: fiveFive,
    commitmentCount: 1,
  }),
  aWeapon,
  salt,
  preCommit,
  bWeapon,
  aResult: Result.YouWin,
  bResult: Result.YouLose,
  propose: commitmentHelper.proposeFromSalt({
    ...baseWithBuyIn,
    turnNum: 4,
    allocation: fourSix,
    aWeapon,
    salt,
  }),
  accept: commitmentHelper.accept({
    ...baseWithBuyIn,
    turnNum: 5,
    allocation: fourSix,
    preCommit,
    bWeapon,
  }),
  reveal: commitmentHelper.reveal({
    ...baseWithBuyIn,
    turnNum: 6,
    allocation: sixFour,
    bWeapon,
    aWeapon,
    salt,
  }),

  preFundSetupAHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  preFundSetupASig:
    '0xe08144da0aa0a49be55e6ace7143702be8f4929559af6f3f7e7530912785c1aa173f9bb2c013e86c2a5a40b225adbb07891ccb613a921396a2f2478741dbf3611c',
  preFundSetupBHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  preFundSetupBSig:
    '0x1ed105fe82e2c071a7d4c9c7c9a1f22b6b5f469c71d14b6d29c4a189b1f2e7d763d9fb0575689c70c956331e77e28ef04b25105173f969d744351a3ff56417691b',
  postFundSetupAHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  postFundSetupASig:
    '0x146fc6085a1d26f5550c88d0a082aa39613891e8500b9758a135d6bec7310df945e1bd82596f620e8865ae84427948a2cf2793c2da2d18797c5c6022824e5cab1c',
  postFundSetupBHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  postFundSetupBSig:
    '0x367289f2e5e39aed1f5e6531bda23b38b285b3be59bce82193c0cae1087e7e6258052bd98d53c0d52aeb67efefeac0c90e783ca285f686756ade3db8b26b7edf1c',
  proposeHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001f5cafdccc1599ae1d89b67782e35207b00705758e1d33365035bda45562f9663',
  proposeSig:
    '0xc6c5645ecec370fcd289f61a2edbe2deee83b7a9286c591f2e9b584135bb518f5c03acffcdfa96288ccadece8dff1ea1e13c8b383ac0fabe122174d82f015db41c',
  acceptHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001f5cafdccc1599ae1d89b67782e35207b00705758e1d33365035bda45562f96630000000000000000000000000000000000000000000000000000000000000002',
  acceptSig:
    '0x6d42f71b1b2476c160aa47bfc442e00f58317110ba5ec50472bd10fc419aa1e11427d24fd9a2f34870faa41b763c6fd6a667359c221e10736132efd3d62051ee1b',
  revealHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004444444444444444444444444444444444444444444444444444444444444444',
  revealSig:
    '0xf6eb5279c1f3afdcd210e94b61af721bbad7dac7fd5d5cb40debe0aa40fb92d12af781e958e4b87355c724ab94286db8fe8fb0b25227ac42654ba3a8933bddb61b',
};

export const aResignsAfterOneRound = {
  ...standard,
  resting: commitmentHelper.resting({ ...baseWithBuyIn, turnNum: 7, allocation: sixFour }),
  conclude: commitmentHelper.conclude({ ...base, turnNum: 8, allocation: sixFour }),
  conclude2: commitmentHelper.conclude({ ...base, turnNum: 9, allocation: sixFour }),
  restingHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
  restingSig:
    '0xaad2107ef36e03cbbd94123937ee73f3fea31ea36d4f15467656a67a32c09e844ea3cb51830619eb38c3ed944f645afcbab422bf2a13c9516e63b27210c5ea1d1c',
  concludeHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  conclude2Hex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000009000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  conclude2Sig:
    '0xc7734c1cf0d2988fb7ea2caff803d403e5fc7148f792e184fea521e600fa8e4a1f857a626298949d2ffb10111672e1e283bb3a45a6c77c9e388dc7784be94ceb1c',
};

export const bResignsAfterOneRound = {
  ...standard,
  conclude: commitmentHelper.conclude({ ...base, turnNum: 7, allocation: sixFour }),
  concludeHex:
    '0x0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000005409ED021D9299bf6814279A6A1411A7e866A6310000000000000000000000006Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb00000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004',
  concludeSig:
    '0xee40164052e7f409acd840ac099eee45ec233e068fb5b883e6871ea6d1e3b1516c7b4f7b587844b87ec20191daf2f891b81758db23481b2777bae653748efbf61b',
  conclude2: commitmentHelper.conclude({ ...base, turnNum: 8, allocation: sixFour }),
};

export const insufficientFunds = {
  preFundSetupA: commitmentHelper.preFundSetupB({
    ...baseWithBuyIn,
    turnNum: 0,
    allocation: nineOne,
    commitmentCount: 0,
  }),
  preFundSetupB: commitmentHelper.preFundSetupB({
    ...baseWithBuyIn,
    turnNum: 1,
    allocation: nineOne,
    commitmentCount: 1,
  }),
  postFundSetupA: commitmentHelper.postFundSetupA({
    ...baseWithBuyIn,
    turnNum: 2,
    allocation: nineOne,
    commitmentCount: 0,
  }),
  postFundSetupB: commitmentHelper.postFundSetupB({
    ...baseWithBuyIn,
    turnNum: 3,
    allocation: nineOne,
    commitmentCount: 1,
  }),
  aWeapon,
  bWeapon,
  propose: commitmentHelper.proposeFromSalt({
    ...baseWithBuyIn,
    turnNum: 4,
    allocation: nineOne,
    aWeapon,
    salt,
  }),
  accept: commitmentHelper.accept({
    ...baseWithBuyIn,
    turnNum: 5,
    allocation: eightTwo,
    preCommit,
    bWeapon,
  }),
  reveal: commitmentHelper.reveal({
    ...baseWithBuyIn,
    turnNum: 6,
    allocation: tenZero,
    bWeapon,
    aWeapon,
    salt,
  }),
  conclude: commitmentHelper.conclude({ ...base, turnNum: 7, allocation: tenZero }),
  conclude2: commitmentHelper.conclude({ ...base, turnNum: 8, allocation: tenZero }),
};

export function build(
  customLibraryAddress: string,
  customAsAddress: string,
  customBsAddress: string,
) {
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
    preFundSetupA: commitmentHelper.preFundSetupA({
      ...baseWithBuyIn,
      turnNum: 0,
      allocation: fiveFive,
      commitmentCount: 0,
    }),
    preFundSetupB: commitmentHelper.preFundSetupB({
      ...baseWithBuyIn,
      turnNum: 1,
      allocation: fiveFive,
      commitmentCount: 1,
    }),
    postFundSetupA: commitmentHelper.postFundSetupA({
      ...baseWithBuyIn,
      turnNum: 2,
      allocation: fiveFive,
      commitmentCount: 0,
    }),
    postFundSetupB: commitmentHelper.postFundSetupB({
      ...baseWithBuyIn,
      turnNum: 3,
      allocation: fiveFive,
      commitmentCount: 1,
    }),
    aWeapon,
    salt,
    preCommit,
    bWeapon,
    aResult: Result.YouWin,
    bResult: Result.YouLose,
    propose: commitmentHelper.proposeFromSalt({
      ...baseWithBuyIn,
      turnNum: 4,
      allocation: fiveFive,
      aWeapon,
      salt,
    }),
    accept: commitmentHelper.accept({
      ...baseWithBuyIn,
      turnNum: 5,
      allocation: fourSix,
      preCommit,
      bWeapon,
    }),
    reveal: commitmentHelper.reveal({
      ...baseWithBuyIn,
      turnNum: 6,
      allocation: sixFour,
      bWeapon,
      aWeapon,
      salt,
    }),
    resting: commitmentHelper.resting({ ...baseWithBuyIn, turnNum: 7, allocation: sixFour }),
  };
}
