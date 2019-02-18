import { ethers } from "ethers";
import { Channel, State, StateType } from "fmg-core";
import { put } from "redux-saga/effects";

import { transactionConfirmed, transactionFinalized, transactionSentToMetamask, transactionSubmitted } from '../redux/actions';
import { transactionSender } from "../redux/sagas/transaction-sender";
import { signCommitment, signVerificationData } from '../utils/signing-utils';
import { getLibraryAddress } from './test-utils';
import {
  createDeployTransaction,
  createDepositTransaction,
  createForceMoveTransaction,
  createConcludeTransaction,
  createRespondWithMoveTransaction,
  createRefuteTransaction,
  ConcludeAndWithdrawArgs,
  createConcludeAndWithdrawTransaction,
  createWithdrawTransaction
} from '../utils/transaction-generator';

import { deployContract, depositContract, createChallenge, concludeGame } from './test-utils';
import { bigNumberify, toHex } from 'fmg-core';

jest.setTimeout(20000);

describe('transactions', () => {
  let networkId;
  let libraryAddress;
  let nonce = 5;
  const provider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(`http://localhost:${process.env.DEV_GANACHE_PORT}`);

  const participantA = ethers.Wallet.createRandom();
  const participantB = ethers.Wallet.createRandom();
  const participants = [participantA.address, participantB.address] as [string, string];

  function getNextNonce() {
    return ++nonce;
  }
  async function testTransactionSender(transactionToSend) {

    const saga = transactionSender(transactionToSend);
    saga.next();
    expect(saga.next(provider).value).toEqual(put(transactionSentToMetamask()));
    const signer = provider.getSigner();
    const transactionReceipt = await signer.sendTransaction(transactionToSend);
    saga.next();
    expect(saga.next(transactionReceipt).value).toEqual(put(transactionSubmitted(transactionReceipt.hash || "")));
    const confirmedTransaction = await transactionReceipt.wait();
    saga.next();
    expect(saga.next(confirmedTransaction).value).toEqual(put(transactionConfirmed(confirmedTransaction.contractAddress)));

    //  saga.next();
    expect(saga.next().value).toEqual(put(transactionFinalized()));
    expect(saga.next().done).toBe(true);

  }

  beforeAll(async () => {
    const network = await provider.getNetwork();
    networkId = network.chainId;
    libraryAddress = getLibraryAddress(networkId);
  });


  it('should deploy the contract', async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const deployTransaction = createDeployTransaction(networkId, channel.id, '0x5');
    await testTransactionSender(deployTransaction);

  });
  it('should deposit into the contract', async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const contractAddress = await deployContract(provider, channel.channelNonce, participantA, participantB) as string;
    const depositTransaction = createDepositTransaction(contractAddress, '0x5');
    await testTransactionSender(depositTransaction);

  });
  it("should send a forceMove transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

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

    const forceMoveTransaction = createForceMoveTransaction(contractAddress, toHex(fromState), toHex(toState), fromSig, toSig);
    await testTransactionSender(forceMoveTransaction);

  });

  it("should send a respondWithMove transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
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

    const respondWithMoveTransaction = createRespondWithMoveTransaction(contractAddress, toHex(toState), toSig);
    await testTransactionSender(respondWithMoveTransaction);
  });

  it("should send a refute transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
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

    const refuteTransaction = createRefuteTransaction(contractAddress, toHex(toState), toSig);
    await testTransactionSender(refuteTransaction);
  });

  it("should send a conclude and withdraw transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

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
    const verificationSignature = signVerificationData(participantA.address, participantA.address, channel.id, participantA.privateKey);
    const concludeAndWithdrawArgs: ConcludeAndWithdrawArgs = {
      contractAddress,
      channelId: channel.id,
      fromState: toHex(fromState),
      toState: toHex(toState),
      fromSignature,
      toSignature,
      participant: participantA.address,
      destination: participantA.address,
      verificationSignature,
    };
    const concludeAndWithdrawTransaction = createConcludeAndWithdrawTransaction(concludeAndWithdrawArgs);
    await testTransactionSender(concludeAndWithdrawTransaction);
  });

  it("should send a conclude transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

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

    const concludeTransaction = createConcludeTransaction(contractAddress, toHex(fromState), toHex(toState), fromSignature, toSignature);
    await testTransactionSender(concludeTransaction);
  });

  it("should send a withdraw transaction", async () => {
    const channel = new Channel(libraryAddress, getNextNonce(), participants);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await concludeGame(provider, contractAddress, channelNonce, participantA, participantB);
    const verificationSignature = signVerificationData(participantA.address, participantA.address, channel.id, participantA.privateKey);
    const withdrawTransaction = createWithdrawTransaction(contractAddress, participantA.address, participantA.address, channel.id, verificationSignature);
    await testTransactionSender(withdrawTransaction);
  });
});