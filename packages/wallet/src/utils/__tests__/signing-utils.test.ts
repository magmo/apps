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
  expect(signature).toEqual('0x8f8bde1b2f879911e36747ebd652c14a177f9a66d5c93b3daad8f9f8896773df49016adf604f2bed17eb8b0deba581d5ab56c77c964367a50e7f96bd47ca0bbe1b');
});