import { ethers } from 'ethers';
import { ADJUDICATOR_ADDRESS, NETWORK_ID, ADJUDICATOR_ABI } from '../constants';

export async function getProvider(): Promise<ethers.providers.Web3Provider> {
  return await new ethers.providers.Web3Provider(web3.currentProvider);
}

export async function getAdjudicatorContract(provider) {
  await provider.ready;
  return new ethers.Contract(ADJUDICATOR_ADDRESS, getAdjudicatorInterface(), provider);
}

export function getAdjudicatorInterface(): ethers.utils.Interface {
  return new ethers.utils.Interface(JSON.parse(ADJUDICATOR_ABI));
}

export function isDevelopmentNetwork(): boolean {
  return (
    NETWORK_ID > 8 && // various test nets
    NETWORK_ID !== 42 && // kovan
    NETWORK_ID !== 60 && // go chain
    NETWORK_ID !== 77 && // sokol
    NETWORK_ID !== 99 && // core
    NETWORK_ID !== 100 && // xDai
    NETWORK_ID !== 31337 && // go chain test
    NETWORK_ID !== 401697 && // tobalaba
    NETWORK_ID !== 7762959 && // musicoin
    NETWORK_ID !== 61717561 // aquachain
  );
}

export async function getAdjudicatorHoldings(provider, channelId) {
  const contract = await getAdjudicatorContract(provider);
  const holdingForChannel = await contract.holdings(channelId);
  return holdingForChannel;
}

export async function getAdjudicatorOutcome(provider, channelId) {
  const contract = await getAdjudicatorContract(provider);
  const outcomeForChannel = await contract.outcomes(channelId);
  return outcomeForChannel;
}
