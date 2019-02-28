import * as ethers from 'ethers';
import RouletteArtifact from '../../build/contracts/RouletteGame.json';
import { Commitment, CommitmentType, Channel, asEthersObject } from 'fmg-core';
jest.setTimeout(20000);


describe("Roulette", () => {
  let networkId;
  let rouletteContract;

  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const channel: Channel = { channelType: '0x' + '1'.repeat(40), nonce: 0, participants: [] };
  const commitment: Commitment = {
    channel,
    turnNum: 0,
    allocation: [],
    destination: [],
    commitmentCount: 0,
    commitmentType: CommitmentType.PreFundSetup,
    appAttributes: '0x0',
  };

  beforeAll(async () => {

    networkId = (await provider.getNetwork()).chainId;
    const libraryAddress = RouletteArtifact.networks[networkId].address;
    console.log(libraryAddress);
    rouletteContract = new ethers.Contract(libraryAddress, RouletteArtifact.abi, provider);


  });


  // Transition function tests
  // ========================

  it(" validates the transition", async () => {
    const ethersObject = asEthersObject(commitment);

    expect(await rouletteContract.functions.validTransition(ethersObject, ethersObject)).toBe(true);
  });
});