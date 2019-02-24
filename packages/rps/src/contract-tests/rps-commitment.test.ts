import { scenarios, } from '../core';

import hexToBN from '../utils/hexToBN';

import rpsStateArtifact from '../../build/contracts/RockPaperScissorsState.json';
import { ethers } from 'ethers';
import { asEthersObject } from 'fmg-core';

describe('RockPaperScissorsState', () => {

  const scenario = scenarios.standard;
  const propose = scenario.propose;
  const reveal = scenario.reveal;
  const provider = new ethers.providers.JsonRpcProvider(`http://localhost:${process.env.DEV_GANACHE_PORT}`);
  let commitmentContract;
  let networkId;
  beforeAll(async () => {

    networkId = (await provider.getNetwork()).chainId;
    const libraryAddress = rpsStateArtifact.networks[networkId].address;

    commitmentContract = new ethers.Contract(libraryAddress, rpsStateArtifact.abi, provider);
  });


});
