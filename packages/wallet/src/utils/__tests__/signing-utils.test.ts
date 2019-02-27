import * as scenarios from '../../redux/reducers/__tests__/test-scenarios';
import { signCommitment, signData, validSignature, validCommitmentSignature, signVerificationData } from '../signing-utils';


describe("signing and validating commitments", () => {
  let commitmentSignature;
  it('should sign a commitment', () => {
    commitmentSignature = signCommitment(scenarios.gameCommitment1, scenarios.asPrivateKey);
  });
  it("should return true when a signature is valid", () => {
    expect(validCommitmentSignature(scenarios.gameCommitment1, commitmentSignature, scenarios.asAddress)).toBe(true);
  });

  it("should return false when a signature is invalid", () => {
    expect(validCommitmentSignature(scenarios.gameCommitment1, '0x0', scenarios.asAddress)).toBe(false);
  });
});

describe("signing and validating arbitrary data", () => {
  const data = 'Some stuff to sign';
  let dataSignature;
  it('should sign some data', () => {
    dataSignature = signData(data, scenarios.asPrivateKey);
  });
  it("should return true when a signature is valid", () => {
    expect(validSignature(data, dataSignature, scenarios.asAddress)).toBe(true);
  });

  it("should return false when a signature is invalid", () => {
    expect(validSignature(data, '0x0', scenarios.asAddress)).toBe(false);
  });
});

it('should sign verification data', () => {
  const signature = signVerificationData(scenarios.asAddress, scenarios.asAddress, scenarios.channelId, scenarios.asAddress, scenarios.asPrivateKey);
  // TODO: This isn't a great test since we can't really validate the signature 
  expect(signature).toEqual('0xb488aca329ac19ce395e4e83993160e3ebac2f41c537a1ead5a04dc614ef6c5514315b438b2e6a974b0aab95f72ecc54724066ea81863676bcaf417e70aa1f941b');
});