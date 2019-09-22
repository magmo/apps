import { ethers } from 'ethers';

// TODO: Switch these to the proper addresses. Depends on how we will import the artifacts
export const ADJUDICATOR_ADDRESS = ethers.Wallet.createRandom().address; // getAdjudicatorContractAddress();
export const CONSENSUS_LIBRARY_ADDRESS = ethers.Wallet.createRandom().address; // getConsensusContractAddress();
export const NETWORK_ID = '0x1 '; //getNetworkId();
export const USE_STORAGE = process.env.USE_STORAGE === 'TRUE';
// TODO: Move top ENV variable
export const HUB_ADDRESS = '0x100063c326b27f78b2cBb7cd036B8ddE4d4FCa7C';
export const ETH_ASSET_HOLDER = ethers.Wallet.createRandom().address;
