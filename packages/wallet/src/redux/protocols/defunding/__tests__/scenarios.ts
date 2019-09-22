import * as states from '../states';
import * as testScenarios from '../../../../domain/commitments/__tests__';
import { setFundingState } from '../../../state';
import * as ledgerDefunding from '../../ledger-defunding/__tests__';
import { bigNumberify } from 'ethers/utils';
import * as virtualDefunding from '../../virtual-defunding/__tests__';
import _ from 'lodash';
import { prependToLocator, makeLocator, EMPTY_LOCATOR } from '../..';
import { EmbeddedProtocol } from '../../../../communication';
import { mergeSharedData } from '../../../__tests__/helpers';
const processId = 'process-id.123';

const { asAddress, bsAddress, channelId } = testScenarios;

const twoThree = testScenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);

const concludeCommitment1 = testScenarios.appState({ turnNum: 51, isFinal: true });
const concludeCommitment2 = testScenarios.appState({ turnNum: 52, isFinal: true });
const ledger4 = testScenarios.ledgerState({ turnNum: 4, outcome: twoThree });
const ledger5 = testScenarios.ledgerState({ turnNum: 5, outcome: twoThree });

const channelStatus = testScenarios.channelStateFromStates([
  concludeCommitment1,
  concludeCommitment2,
]);

const ledgerChannelStatus = testScenarios.channelStateFromStates([ledger4, ledger5]);
const { TWO_PARTICIPANT_LEDGER_CHANNEL_ID: ledgerId } = testScenarios;

const waitForLedgerDefunding = states.waitForLedgerDefunding({
  processId,
  channelId,
  ledgerId,
  protocolLocator: EMPTY_LOCATOR,
  ledgerDefundingState: prependToLocator(
    ledgerDefunding.preSuccessState.state,
    EmbeddedProtocol.LedgerDefunding,
  ),
});

const waitForVirtualDefunding = states.waitForVirtualDefunding({
  processId,
  channelId,
  ledgerId,
  protocolLocator: EMPTY_LOCATOR,
  virtualDefunding: prependToLocator(
    virtualDefunding.preSuccess.state,
    makeLocator(EmbeddedProtocol.VirtualDefunding),
  ),
});

export const indirectlyFundingChannelHappyPath = {
  initialize: {
    processId,
    channelId,
    protocolLocator: EMPTY_LOCATOR,
    sharedData: testScenarios.setChannels(
      setFundingState(
        setFundingState(ledgerDefunding.initialStore, channelId, {
          directlyFunded: false,
          fundingChannel: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
        }),
        testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
        { directlyFunded: true },
      ),
      [channelStatus],
    ),
  },
  // States
  waitForLedgerDefunding: {
    state: waitForLedgerDefunding,
    action: prependToLocator(ledgerDefunding.successTrigger, EmbeddedProtocol.LedgerDefunding),
    sharedData: testScenarios.setChannels(
      setFundingState(
        setFundingState(ledgerDefunding.preSuccessState.sharedData, channelId, {
          directlyFunded: false,
          fundingChannel: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
        }),
        testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
        { directlyFunded: true },
      ),
      [channelStatus, ledgerChannelStatus],
    ),
  },
};

export const virtualFundingChannelHappyPath = {
  initialize: {
    processId,
    protocolLocator: EMPTY_LOCATOR,
    channelId: virtualDefunding.initial.targetChannelId,
    sharedData: mergeSharedData(
      virtualDefunding.preSuccess.sharedData,
      ledgerDefunding.preSuccessState.sharedData,
    ),
  },
  // States
  waitForVirtualDefunding: {
    state: waitForVirtualDefunding,
    action: prependToLocator(virtualDefunding.preSuccess.action, EmbeddedProtocol.VirtualDefunding),
    sharedData: virtualDefunding.preSuccess.sharedData,
  },
};
