import { splitSignature, getAddress } from 'ethers/utils';
import { recover, sign, SolidityType, Commitment, toHex } from 'fmg-core';


export const validCommitmentSignature = (commitment: Commitment, signature: string, address: string) => {
  return validSignature(toHex(commitment), signature, address);
};

export const validSignature = (data: string, signature: string, address: string) => {
  try {
    const { v: vNum, r, s } = splitSignature(signature);
    const v = '0x' + (vNum as number).toString(16);

    const recovered = recover(data, v, r, s);

    return recovered === getAddress(address);
  } catch (err) {

    return false;
  }
};

export const signCommitment = (commitment: Commitment, privateKey: string) => {
  return signData(toHex(commitment), privateKey);
};

export const signData = (data: string, privateKey: string) => {
  const signature = sign(data, privateKey) as any;
  return signature.signature;
};

export const signVerificationData = (playerAddress: string, destination: string, channelId: string, privateKey) => {
  const data = [
    { type: SolidityType.address, value: playerAddress },
    { type: SolidityType.address, value: destination },
    { type: SolidityType.bytes32, value: channelId },
  ];
  const signature = sign(data, privateKey) as any;
  return signature.signature;
};