import { ethers } from "ethers";

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
import { Channel, Commitment, CommitmentType, toHex } from 'fmg-core';
import { channelID } from 'fmg-core/lib/channel';

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
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const channelId = channelID(channel);
    const deployTransaction = createDeployTransaction(networkId, channelId, '0x5');
    await testTransactionSender(deployTransaction);

  });
  it('should deposit into the contract', async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const contractAddress = await deployContract(provider, channel.channelNonce, participantA, participantB) as string;
    const depositTransaction = createDepositTransaction(contractAddress, '0x5');
    await testTransactionSender(depositTransaction);

  });
  it("should send a forceMove transaction", async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

    const fromCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 5,
      commitmentType: CommitmentType.App,
      appAttributes: '0x0',
      commitmentCount: 0,
    };

    const toCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 6,
      commitmentType: CommitmentType.App,
      appAttributes: '0x0',
      commitmentCount: 1,
    };
    const fromSig = signCommitment(fromCommitment, participantB.privateKey);
    const toSig = signCommitment(toCommitment, participantA.privateKey);

    const forceMoveTransaction = createForceMoveTransaction(contractAddress, toHex(fromCommitment), toHex(toCommitment), fromSig, toSig);
    await testTransactionSender(forceMoveTransaction);

  });

  it("should send a respondWithMove transaction", async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
    const toCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 6,
      commitmentType: CommitmentType.App,
      appAttributes: '0x0',
      commitmentCount: 1,
    };

    const toSig = signCommitment(toCommitment, participantB.privateKey);

    const respondWithMoveTransaction = createRespondWithMoveTransaction(contractAddress, toHex(toCommitment), toSig);
    await testTransactionSender(respondWithMoveTransaction);
  });

  it("should send a refute transaction", async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await createChallenge(provider, contractAddress, channelNonce, participantA, participantB);
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

    const refuteTransaction = createRefuteTransaction(contractAddress, toHex(toCommitment), toSig);
    await testTransactionSender(refuteTransaction);
  });

  it("should send a conclude and withdraw transaction", async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const { channelNonce } = channel;
    const channelId = channelID(channel);
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

    const fromCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 5,
      commitmentType: CommitmentType.Conclude,
      appAttributes: '0x0',
      commitmentCount: 0,
    };

    const toCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 6,
      commitmentType: CommitmentType.Conclude,
      appAttributes: '0x0',
      commitmentCount: 1,
    };
    const fromSignature = signCommitment(fromCommitment, participantA.privateKey);
    const toSignature = signCommitment(toCommitment, participantB.privateKey);

    const verificationSignature = signVerificationData(participantA.address, participantA.address, channelId, participantA.privateKey);
    const concludeAndWithdrawArgs: ConcludeAndWithdrawArgs = {
      contractAddress,
      channelId,
      fromState: toHex(fromCommitment),
      toState: toHex(toCommitment),
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
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);

    const fromCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 5,
      commitmentType: CommitmentType.Conclude,
      appAttributes: '0x0',
      commitmentCount: 0,
    };

    const toCommitment: Commitment = {
      channel,
      allocation: [],
      destination: [],
      turnNum: 6,
      commitmentType: CommitmentType.Conclude,
      appAttributes: '0x0',
      commitmentCount: 1,
    };
    const fromSignature = signCommitment(fromCommitment, participantA.privateKey);
    const toSignature = signCommitment(toCommitment, participantB.privateKey);

    const concludeTransaction = createConcludeTransaction(contractAddress, toHex(fromCommitment), toHex(toCommitment), fromSignature, toSignature);
    await testTransactionSender(concludeTransaction);
  });

  it("should send a withdraw transaction", async () => {
    const channel: Channel = { channelType: libraryAddress, channelNonce: getNextNonce(), participants };
    const channelId = channelID(channel);
    const { channelNonce } = channel;
    const contractAddress = await deployContract(provider, channelNonce, participantA, participantB) as string;
    await depositContract(provider, contractAddress);
    await concludeGame(provider, contractAddress, channelNonce, participantA, participantB);
    const verificationSignature = signVerificationData(participantA.address, participantA.address, channelId, participantA.privateKey);
    const withdrawTransaction = createWithdrawTransaction(contractAddress, participantA.address, participantA.address, channelId, verificationSignature);
    await testTransactionSender(withdrawTransaction);
  });
});