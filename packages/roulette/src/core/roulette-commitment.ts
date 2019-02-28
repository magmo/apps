// import { BaseCommitment, Bytes32, Uint8, Uint256, Commitment, CommitmentType } from 'fmg-core';
// import abi from 'web3-eth-abi';

// // export interface AppAttributes {

// // }

// // const SolidityRouletteCommitmentType = {
// //   "RouletteCommitmentStruct": {

// //   },
// // };

// export interface RouletteBaseCommitment extends BaseCommitment {

// }

// export interface RouletteCommitment extends RouletteBaseCommitment {
//   commitmentType: CommitmentType;
// }

// function encodeAppAttributes(appAttrs: AppAttributes): string {

//   return abi.encodeParameter(Roulette,
//     [positionType, stake, preCommit, bWeapon, aWeapon, salt,]);
// }

// function decodeAppAttributes(appAttrs: string): AppAttributes {
//   const parameters = abi.decodeParameter(SolidityRouletteCommitmentType, appAttrs);
//   return {

//   };
// }

// export function fromCoreCommitment(commitment: Commitment): RouletteCommitment {
//   const {
//   } = commitment;
//   return {

//     ...decodeAppAttributes(commitment.appAttributes),
//   };
// }

// export function asCoreCommitment(rpsCommitment: RouletteCommitment): Commitment {
//   const {

//   } = rpsCommitment;

//   return {
//     appAttributes: encodeAppAttributes({  }),
//   };
// }

