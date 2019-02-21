import { ethers } from 'ethers';
import { CommitmentType, Commitment, Channel } from 'fmg-core';
import { createDepositTransaction, createForceMoveTransaction, createConcludeTransaction, createRefuteTransaction, createRespondWithMoveTransaction, } from '../utils/transaction-generator';
import { signCommitment } from '../utils/signing-utils';
import testGameArtifact from '../../build/contracts/TestGame.json';
import { bigNumberify } from 'ethers/utils';
export function getLibraryAddress(networkId) {
  return testGameArtifact.networks[networkId].address;

}
export const fiveFive = [bigNumberify(5).toHexString(), bigNumberify(5).toHexString()] as [string, string];
export const fourSix = [bigNumberify(4).toHexString(), bigNumberify(6).toHexString()] as [string, string];


export async function depositContract(provider: ethers.providers.JsonRpcProvider, contractAddress: string, participant: string) {

  const signer = provider.getSigner();
  const deployTransaction = createDepositTransaction(contractAddress, participant, '0x5');
  const transactionReceipt = await signer.sendTransaction(deployTransaction);
  await transactionReceipt.wait();
}

export async function createChallenge(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel: Channel = { channelType: libraryAddress, channelNonce, participants: [participantA.address, participantB.address] };

  const fromCommitment: Commitment = {
    channel,
    allocation: ['0x05', '0x05'],
    destination: [participantA.address, participantB.address],
    turnNum: 5,
    commitmentType: CommitmentType.App,
    appAttributes: '0x0',
    commitmentCount: 0,
  };

  const toCommitment: Commitment = {
    channel,
    allocation: ['0x05', '0x05'],
    destination: [participantA.address, participantB.address],
    turnNum: 6,
    commitmentType: CommitmentType.App,
    appAttributes: '0x0',
    commitmentCount: 0,
  };

  const fromSig = signCommitment(fromCommitment, participantB.privateKey);
  const toSig = signCommitment(toCommitment, participantA.privateKey);
  const challengeTransaction = createForceMoveTransaction(address, fromCommitment, toCommitment, fromSig, toSig);
  const transactionReceipt = await signer.sendTransaction(challengeTransaction);
  await transactionReceipt.wait();
  return toCommitment;
}

export async function concludeGame(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel: Channel = { channelType: libraryAddress, channelNonce, participants: [participantA.address, participantB.address] };

  const fromCommitment: Commitment = {
    channel,
    allocation: ['0x05', '0x05'],
    destination: [participantA.address, participantB.address],
    turnNum: 5,
    commitmentType: CommitmentType.Conclude,
    appAttributes: '0x0',
    commitmentCount: 0,
  };

  const toCommitment: Commitment = {
    channel,
    allocation: ['0x05', '0x05'],
    destination: [participantA.address, participantB.address],
    turnNum: 6,
    commitmentType: CommitmentType.Conclude,
    appAttributes: '0x0',
    commitmentCount: 0,
  };

  const fromSignature = signCommitment(fromCommitment, participantA.privateKey);
  const toSignature = signCommitment(toCommitment, participantB.privateKey);

  const concludeTransaction = createConcludeTransaction(address, fromCommitment, toCommitment, fromSignature, toSignature);
  const transactionReceipt = await signer.sendTransaction(concludeTransaction);
  await transactionReceipt.wait();
}

export async function respondWithMove(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel: Channel = { channelType: libraryAddress, channelNonce, participants: [participantA.address, participantB.address] };

  const toCommitment: Commitment = {
    channel,
    allocation: [],
    destination: [],
    turnNum: 5,
    commitmentType: CommitmentType.App,
    appAttributes: '0x0',
    commitmentCount: 0,
  };

  const toSig = signCommitment(toCommitment, participantB.privateKey);

  const respondWithMoveTransaction = createRespondWithMoveTransaction(address, toCommitment, toSig);
  const transactionReceipt = await signer.sendTransaction(respondWithMoveTransaction);
  await transactionReceipt.wait();
  return toCommitment;
}

export async function refuteChallenge(provider: ethers.providers.JsonRpcProvider, address, channelNonce, participantA, participantB) {

  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const networkId = network.chainId;
  const libraryAddress = getLibraryAddress(networkId);
  const channel: Channel = { channelType: libraryAddress, channelNonce, participants: [participantA.address, participantB.address] };

  const toCommitment: Commitment = {
    channel,
    allocation: [],
    destination: [],
    turnNum: 6,
    commitmentType: CommitmentType.App,
    appAttributes: '0x0',
    commitmentCount: 1,
  };

  const toSig = signCommitment(toCommitment, participantA.privateKey);
  const refuteTransaction = createRefuteTransaction(address, toCommitment, toSig);
  const transactionReceipt = await signer.sendTransaction(refuteTransaction);
  await transactionReceipt.wait();
  return toCommitment;
}