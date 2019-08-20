import { ProcessProtocol } from 'magmo-wallet/lib/src/communication';
import { Model, snakeCaseMappers } from 'objection';

export default class WalletProcess extends Model {
  static tableName = 'wallet_processes';

  readonly id!: number;
  processId!: string;
  theirAddress!: string;
  protocol!: string;

  static get columnNameMappers() {
    return snakeCaseMappers();
  }

  get appChannelId() {
    const process = this.processId.split('-')[0];
    if (process !== ProcessProtocol.CloseLedgerChannel) {
      return this.processId.split('-')[1];
    }
    return '';
  }
}
