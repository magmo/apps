import { ethers } from 'ethers';
import { Channel, State, toHex } from 'fmg-core';
import { createDeployTransaction, createDepositTransaction, createForceMoveTransaction, createConcludeTransaction, createRefuteTransaction, createRespondWithMoveTransaction, } from '../utils/transaction-generator';
import { signCommitment } from '../utils/signing-utils';
import testGameArtifact from '../../build/contracts/TestGame.json';
import { bigNumberify, StateType } from 'fmg-core';
export function getLibraryAddress(networkId) {
  return testGameArtifact.networks[networkId].address;

}
export const fiveFive = [bigNumberify(5).toHexString(), bigNumberify(5).toHexString()] as [string, string];
export const fourSix = [bigNumberify(4).toHexString(), bigNumberify(6).toHexString()] as [string, string];

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

  const fromState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(5),
    stateType: StateType.Game,
    gameAttributes: '0x0',
    stateCount: bigNumberify(0),
  };

  const toState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(6),
    stateType: StateType.Game,
    gameAttributes: '0x0',
    stateCount: bigNumberify(1),
  };

  const fromSig = signCommitment(fromState, participantB.privateKey);
  const toSig = signCommitment(toState, participantA.privateKey);
  const challengeTransaction = createForceMoveTransaction(address, toHex(fromState), toHex(toState), fromSig, toSig);
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
  const fromState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(5),
    stateType: StateType.Conclude,
    gameAttributes: '0x0',
    stateCount: bigNumberify(0),
  };

  const toState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(6),
    stateType: StateType.Conclude,
    gameAttributes: '0x0',
    stateCount: bigNumberify(1),
  };

  const fromSignature = signCommitment(fromState, participantA.privateKey);
  const toSignature = signCommitment(toState, participantB.privateKey);

  const concludeTransaction = createConcludeTransaction(address, toHex(fromState),toHex(toState), fromSignature, toSignature);
  const transactionReceipt = await signer.sendTransaction(concludeTransaction);
  await transactionReceipt.wait();
}

export async function respondWithMove(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel = new Channel(libraryAddress, channelNonce, [participantA.address, participantB.address]);

  const toState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(6),
    stateType: StateType.Game,
    gameAttributes: '0x0',
    stateCount: bigNumberify(1),
  };

  const toSig = signCommitment(toState, participantB.privateKey);

  const respondWithMoveTransaction = createRespondWithMoveTransaction(address, toHex(toState), toSig);
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

  const toState: State = {
    channel,
    allocation: [],
    destination: [],
    turnNum: bigNumberify(6),
    stateType: StateType.Game,
    gameAttributes: '0x0',
    stateCount: bigNumberify(1),
  };

  const toSig = signCommitment(toState, participantA.privateKey);
  const refuteTransaction = createRefuteTransaction(address, toHex(toState), toSig);
  const transactionReceipt = await signer.sendTransaction(refuteTransaction);
  await transactionReceipt.wait();
  return toState;
}