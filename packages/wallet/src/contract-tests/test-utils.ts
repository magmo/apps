import { ethers } from 'ethers';
import { Channel, padBytes32, State } from 'fmg-core';
import { createDeployTransaction, createDepositTransaction, createForceMoveTransaction, createConcludeTransaction, createRefuteTransaction, createRespondWithMoveTransaction, } from '../utils/transaction-generator';
import { signPositionHex } from '../utils/signing-utils';
import testGameArtifact from '../../build/contracts/TestGame.json';

import BN from 'bn.js';

function bnToHex(bn: BN) {
  return padBytes32('0x' + bn.toString(16));
}

export function getLibraryAddress(networkId) {
  return testGameArtifact.networks[networkId].address;

}
export const fiveFive = [new BN(5), new BN(5)].map(bnToHex) as [string, string];
export const fourSix = [new BN(4), new BN(6)].map(bnToHex) as [string, string];

export async function deployContract(provider: ethers.providers.JsonRpcProvider, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);
  const deployTransaction = createDeployTransaction(networkId, channel.id, '0x5');
  const transactionReceipt = await signer.sendTransaction(deployTransaction);
  const confirmedTransaction = await transactionReceipt.wait();

  return confirmedTransaction.contractAddress as string;
}

export async function depositContract(provider: ethers.providers.JsonRpcProvider, address) {

  const signer = provider.getSigner();
  const deployTransaction = createDepositTransaction(address, '0x5');
  const transactionReceipt = await signer.sendTransaction(deployTransaction);
  await transactionReceipt.wait();
}

export async function createChallenge(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);

  const fromState = new State({
    channel,
    resolution: [new BN(5), new BN(5)],
    turnNum: 5,
    stateType: State.StateType.Game,
  }).toHex();

  const toState = new State({
    channel,
    resolution: [new BN(6), new BN(4)],
    turnNum: 6,
    stateType: State.StateType.Game,
  }).toHex();

  const fromSig = signPositionHex(fromState, participantB.privateKey);
  const toSig = signPositionHex(toState, participantA.privateKey);
  const challengeTransaction = createForceMoveTransaction(address, fromState, toState, fromSig, toSig);
  const transactionReceipt = await signer.sendTransaction(challengeTransaction);
  await transactionReceipt.wait();
  return toState;
}

export async function concludeGame(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);

  const fromState = new State({
    channel,
    resolution: [new BN(5), new BN(5)],
    turnNum: 50,
    stateType: State.StateType.Conclude,
  }).toHex();

  const toState = new State({
    channel,
    resolution: [new BN(5), new BN(5)],
    turnNum: 51,
    stateType: State.StateType.Conclude,
  }).toHex();

  const fromSignature = signPositionHex(fromState, participantA.privateKey);
  const toSignature = signPositionHex(toState, participantB.privateKey);

  const concludeTransaction = createConcludeTransaction(address, fromState, toState, fromSignature, toSignature);
  const transactionReceipt = await signer.sendTransaction(concludeTransaction);
  await transactionReceipt.wait();
}

export async function respondWithMove(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);

  const toState = new State({
    channel,
    resolution: [new BN(6), new BN(4)],
    turnNum: 7,
    stateType: State.StateType.Game,
  }).toHex();
  const toSig = signPositionHex(toState, participantB.privateKey);

  const respondWithMoveTransaction = createRespondWithMoveTransaction(address, toState, toSig);
  const transactionReceipt = await signer.sendTransaction(respondWithMoveTransaction);
  await transactionReceipt.wait();
  return toState;
}

export async function refuteChallenge(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);

  const toState = new State({
    channel,
    resolution: [new BN(5), new BN(5)],
    turnNum: 100,
    stateType: State.StateType.Game,
  }).toHex();
  const toSig = signPositionHex(toState, participantA.privateKey);
  const refuteTransaction = createRefuteTransaction(address, toState, toSig);
  const transactionReceipt = await signer.sendTransaction(refuteTransaction);
  await transactionReceipt.wait();
  return toState;
}