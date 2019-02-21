import { ethers } from 'ethers';

import NitroAdjudicatorArtifact from '../../build/contracts/NitroAdjudicator.json';

export async function getProvider(): Promise<ethers.providers.Web3Provider> {
  return await new ethers.providers.Web3Provider(web3.currentProvider);
}

export async function getAdjudicatorContract(provider) {

  const networkId = (await provider.getNetwork()).chainId;
  const contractAddress = NitroAdjudicatorArtifact.networks[networkId].address;
  return new ethers.Contract(contractAddress, getAdjudicatorInterface(), provider);
}

export function getAdjudicatorInterface(): ethers.utils.Interface {
  return new ethers.utils.Interface(NitroAdjudicatorArtifact.abi);
}

export async function getAdjudicatorContractAddress(provider) {
  console.log(provider);
  console.log(await provider.getNetwork());
  const networkId = (await provider.getNetwork()).chainId;
  return NitroAdjudicatorArtifact.networks[networkId].address;
}