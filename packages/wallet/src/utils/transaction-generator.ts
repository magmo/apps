import { TransactionRequest } from 'ethers/providers';
import { getAdjudicatorInterface } from './contract-utils';
import { splitSignature } from 'ethers/utils';
import { Commitment, SignedCommitment } from '../domain';
import { asEthersObject } from 'fmg-core';
import { Transactions as nitroTrans, SignedState } from 'nitro-protocol';
import {
  getChannelStorage,
  convertAddressToBytes32,
  convertCommitmentToState,
} from './nitro-converter';
import { signChallengeMessage } from 'nitro-protocol/lib/src/signatures';
// TODO: This should be exported by `nitro-protocol`
import { createDepositTransaction as createNitroDepositTransaction } from 'nitro-protocol/lib/src/contract/transaction-creators/eth-asset-holder';

export function createForceMoveTransaction(
  fromCommitment: SignedCommitment,
  toCommitment: SignedCommitment,
  privateKey: string,
): TransactionRequest {
  const channelStorage = getChannelStorage(toCommitment.commitment);
  const signedStates = [fromCommitment.signedState, toCommitment.signedState];
  const challengeSignature = signChallengeMessage(signedStates, privateKey);
  return nitroTrans.createForceMoveTransaction(channelStorage, signedStates, challengeSignature);
}

export function createRespondWithMoveTransaction(
  nextState: Commitment,
  signature: string,
): TransactionRequest {
  const adjudicatorInterface = getAdjudicatorInterface();
  const data = adjudicatorInterface.functions.respondWithMove.encode([
    asEthersObject(nextState),
    splitSignature(signature),
  ]);
  return {
    data,
  };
}

export function createRefuteTransaction(
  refuteState: Commitment,
  signature: string,
): TransactionRequest {
  const adjudicatorInterface = getAdjudicatorInterface();
  const data = adjudicatorInterface.functions.refute.encode([
    asEthersObject(refuteState),
    splitSignature(signature),
  ]);
  return {
    data,
  };
}

export interface ConcludeAndWithdrawArgs {
  fromCommitment: Commitment;
  toCommitment: Commitment;
  fromSignature: string;
  toSignature: string;
  participant: string;
  destination: string;
  amount: string;
  verificationSignature: string;
}
export function createConcludeAndWithdrawTransaction(
  args: ConcludeAndWithdrawArgs,
): TransactionRequest {
  const adjudicatorInterface = getAdjudicatorInterface();
  const splitFromSignature = splitSignature(args.fromSignature);
  const splitToSignature = splitSignature(args.toSignature);
  const conclusionProof = {
    penultimateCommitment: asEthersObject(args.fromCommitment),
    ultimateCommitment: asEthersObject(args.toCommitment),
    penultimateSignature: splitFromSignature,
    ultimateSignature: splitToSignature,
  };
  const { v, r, s } = splitSignature(args.verificationSignature);
  const { participant, destination, amount } = args;
  const data = adjudicatorInterface.functions.concludeAndWithdraw.encode([
    conclusionProof,
    participant,
    destination,
    amount,
    v,
    r,
    s,
  ]);

  return {
    data,
    gasLimit: 3000000,
  };
}

export function createConcludeTransaction(
  fromCommitment: Commitment,
  toCommitment: Commitment,
  fromSignature: string,
  toSignature: string,
): TransactionRequest {
  const splitFromSignature = splitSignature(fromSignature);
  const splitToSignature = splitSignature(toSignature);
  const fromState = convertCommitmentToState(fromCommitment);
  const toState = convertCommitmentToState(toCommitment);

  const signedStates: SignedState[] = [];
  signedStates.push({
    state: fromState,
    signature: splitFromSignature,
  } as SignedState);

  signedStates.push({
    state: toState,
    signature: splitToSignature,
  } as SignedState);

  return nitroTrans.createConcludeTransaction(signedStates);
}

export function createWithdrawTransaction(
  amount: string,
  participant: string,
  destination: string,
  verificationSignature: string,
) {
  const adjudicatorInterface = getAdjudicatorInterface();
  const { v, r, s } = splitSignature(verificationSignature);
  const data = adjudicatorInterface.functions.withdraw.encode([
    participant,
    destination,
    amount,
    v,
    r,
    s,
  ]);

  return {
    data,
    gasLimit: 3000000,
  };
}

export function createTransferAndWithdrawTransaction(
  channelId: string,
  participant: string,
  destination: string,
  amount: string,
  verificationSignature: string,
) {
  const adjudicatorInterface = getAdjudicatorInterface();
  const { v, r, s } = splitSignature(verificationSignature);
  const data = adjudicatorInterface.functions.transferAndWithdraw.encode([
    channelId,
    participant,
    destination,
    amount,
    v,
    r,
    s,
  ]);

  return {
    data,
    gasLimit: 3000000,
  };
}

export function createDepositTransaction(
  destination: string,
  depositAmount: string,
  expectedHeld: string,
) {
  return createNitroDepositTransaction(
    convertAddressToBytes32(destination),
    expectedHeld,
    depositAmount,
  );
}
