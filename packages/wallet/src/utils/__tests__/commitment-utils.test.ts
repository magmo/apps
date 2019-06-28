import { CommitmentType } from 'fmg-core';
import { appCommitment } from '../../domain/commitments/__tests__';
import * as channelScenarios from '../../redux/__tests__/test-scenarios';
import { channelFromCommitments } from '../../redux/channel-store/channel-state/__tests__';
import { composeConcludeCommitment } from '../commitment-utils';
describe('composeConcludeCommitment', () => {
  const { asPrivateKey, asAddress } = channelScenarios;
  const app10 = appCommitment({ turnNum: 10, balances: [] });
  const app11 = appCommitment({ turnNum: 11, balances: [] });
  const app12 = appCommitment({ turnNum: 11, balances: [], isFinal: true });

  it('should create a correct conclude commitment from an app commitment', () => {
    const channelState = channelFromCommitments([app10, app11], asAddress, asPrivateKey);
    const concludeCommitment = composeConcludeCommitment(channelState);
    expect(concludeCommitment).toMatchObject({
      ...app11.commitment,
      commitmentType: CommitmentType.Conclude,
      turnNum: app11.commitment.turnNum + 1,
      commitmentCount: 0,
    });
  });
  it('should create a correct conclude commitment from a conclude commitment', () => {
    const channelState = channelFromCommitments([app11, app12], asAddress, asPrivateKey);
    const concludeCommitment = composeConcludeCommitment(channelState);
    expect(concludeCommitment).toMatchObject({
      ...app11.commitment,
      commitmentType: CommitmentType.Conclude,
      turnNum: app12.commitment.turnNum + 1,
      commitmentCount: 1,
    });
  });
});
