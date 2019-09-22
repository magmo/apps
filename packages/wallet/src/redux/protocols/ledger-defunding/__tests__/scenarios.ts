import {
  asAddress,
  bsAddress,
  channelId,
  convertBalanceToOutcome,
} from '../../../../domain/commitments/__tests__';
import { bigNumberify } from 'ethers/utils/bignumber';
import { waitForLedgerUpdate } from '../states';
import * as ledgerUpdateScenarios from '../../consensus-update/__tests__';
import * as advanceChannelScenarios from '../../advance-channel/__tests__';
import _ from 'lodash';
const processId = 'processId';
const protocolLocator = [];

const twoThree = convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);

const props = {
  processId,
  protocolLocator,
  channelId,
  ledgerId: ledgerUpdateScenarios.twoPlayerPreSuccessA.state.channelId,

  proposedOutcome: twoThree,
};

const ledgerUpdate = ledgerUpdateScenarios.twoPlayerPreSuccessA.state;

// -----------
// Scenarios
// -----------
export const clearedToSendHappyPath = {
  initialParams: {
    sharedData: _.merge(
      ledgerUpdateScenarios.twoPlayerPreSuccessA.sharedData,
      advanceChannelScenarios.conclude.preSuccess.sharedData,
    ),
    ...props,
    clearedToProceed: true,
  },
  waitForLedgerUpdate: {
    state: waitForLedgerUpdate({
      ...props,
      ledgerUpdate,

      clearedToProceed: true,
    }),
    action: ledgerUpdateScenarios.twoPlayerPreSuccessA.action,
    sharedData: ledgerUpdateScenarios.twoPlayerPreSuccessA.sharedData,
  },
};
