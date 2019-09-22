import * as states from '../states';
import * as withdrawalScenarios from '../../withdrawing/__tests__/scenarios';
import * as testScenarios from '../../../../domain/commitments/__tests__';
import _ from 'lodash';
import { prependToLocator } from '../..';
import { EmbeddedProtocol } from '../../../../communication';
import * as advanceChannelScenarios from '../../advance-channel/__tests__';
import { bigNumberify } from 'ethers/utils';
import { mergeSharedData } from '../../../__tests__/helpers';
const processId = 'process-id.123';

const { TWO_PARTICIPANT_LEDGER_CHANNEL_ID: channelId, channelId: appChannelId } = testScenarios;
const twoThree = testScenarios.convertBalanceToOutcome([
  { address: testScenarios.asAddress, wei: bigNumberify(2).toHexString() },
  { address: testScenarios.bsAddress, wei: bigNumberify(3).toHexString() },
]);
const fundingAppChannel = testScenarios.convertBalanceToOutcome([
  { address: appChannelId, wei: bigNumberify(5).toHexString() },
]);

const ledger4 = testScenarios.ledgerState({ turnNum: 4, outcome: twoThree });
const ledger5 = testScenarios.ledgerState({ turnNum: 5, outcome: twoThree });
const ledger6 = testScenarios.ledgerState({ turnNum: 6, outcome: twoThree, isFinal: true });
const ledger7 = testScenarios.ledgerState({ turnNum: 7, outcome: twoThree, isFinal: true });

const ledgerFundingChannel0 = testScenarios.ledgerState({
  turnNum: 4,
  outcome: fundingAppChannel,
});
const ledgerFundingChannel1 = testScenarios.ledgerState({
  turnNum: 5,
  outcome: fundingAppChannel,
});

const app5 = testScenarios.appState({ turnNum: 5, outcome: twoThree });
const app6 = testScenarios.appState({ turnNum: 6, outcome: twoThree });

const ledgerOpenSharedData = testScenarios.setChannels(testScenarios.testEmptySharedData(), [
  testScenarios.channelStateFromStates([ledger4, ledger5]),
]);
const ledgerConcludedSharedData = testScenarios.setChannels(testScenarios.testEmptySharedData(), [
  testScenarios.channelStateFromStates([ledger6, ledger7]),
]);
const ledgerFundingSharedData = testScenarios.setChannels(testScenarios.testEmptySharedData(), [
  testScenarios.channelStateFromStates([ledgerFundingChannel0, ledgerFundingChannel1]),
  testScenarios.channelStateFromStates([app5, app6]),
]);

const waitForWithdrawal = states.waitForWithdrawal({
  processId,
  channelId,
  withdrawal: withdrawalScenarios.happyPath.waitForAcknowledgement.state,
});

const waitForConclude = states.waitForConclude({
  processId,
  channelId,
  concluding: prependToLocator(
    advanceChannelScenarios.conclude.preSuccess.state,
    EmbeddedProtocol.AdvanceChannel,
  ),
});

export const happyPath = {
  initialize: {
    processId,
    channelId: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    sharedData: ledgerOpenSharedData,
  },
  // States
  waitForConclude: {
    state: waitForConclude,
    action: prependToLocator(
      advanceChannelScenarios.conclude.preSuccess.trigger,
      EmbeddedProtocol.AdvanceChannel,
    ),
    sharedData: mergeSharedData(
      advanceChannelScenarios.conclude.preSuccess.sharedData,
      ledgerOpenSharedData,
    ),
  },

  waitForWithdrawal: {
    state: waitForWithdrawal,
    action: withdrawalScenarios.happyPath.waitForAcknowledgement.action,
    sharedData: withdrawalScenarios.happyPath.sharedData,
  },
};

export const alreadyConcluded = {
  initialize: {
    processId,
    channelId: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    sharedData: ledgerConcludedSharedData,
  },
  // States

  waitForWithdrawal: {
    state: waitForWithdrawal,
    action: withdrawalScenarios.happyPath.waitForAcknowledgement.action,
    sharedData: withdrawalScenarios.happyPath.sharedData,
  },
};

export const channelInUseFailure = {
  initialize: {
    processId,
    channelId: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
    sharedData: ledgerFundingSharedData,
  },
};
