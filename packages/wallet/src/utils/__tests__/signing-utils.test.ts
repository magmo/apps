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
  const signature = signVerificationData(scenarios.asAddress, scenarios.asAddress, scenarios.channelId, scenarios.asPrivateKey);
  expect(signature).toEqual('0x87e6164e92ae7b4fc46db8892e8699c138be9c4916060642b33f39a91e0b7f5b6fb8b18b446b193e5b1c6b09f974950495fb12bf1fddd74cc1e36ff53b6632d01c');
});