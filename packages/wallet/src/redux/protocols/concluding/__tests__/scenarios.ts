import * as testScenarios from '../../../../domain/commitments/__tests__';
import * as defundingScenarios from '../../defunding/__tests__';
import * as advanceChannelScenarios from '../../advance-channel/__tests__';

import * as states from '../states';
import { EMPTY_SHARED_DATA, setFundingState } from '../../../state';
import { bigNumberify } from 'ethers/utils';

import { mergeSharedData } from '../../../__tests__/helpers';
import { prependToLocator } from '../../../protocols';
import { EmbeddedProtocol } from '../../../../communication';
import * as actions from '../actions';
import * as ledgerCloseScenarios from '../../close-ledger-channel/__tests__';

const processId = 'processId';
const {
  channelId,
  asAddress,
  bsAddress,
  appState: appCommitment,
  TWO_PARTICIPANT_LEDGER_CHANNEL_ID: ledgerId,
} = testScenarios;
const twoThree = testScenarios.convertBalanceToOutcome([
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
]);

const app50 = appCommitment({ turnNum: 50, outcome: twoThree, isFinal: false });
const app51 = appCommitment({ turnNum: 51, outcome: twoThree, isFinal: false });
const ledger5 = testScenarios.ledgerState({ turnNum: 5, outcome: twoThree });
const ledger6 = testScenarios.ledgerState({ turnNum: 6, outcome: twoThree });

const waitForLedgerClosing = states.waitForLedgerClose({
  processId,
  channelId,
  ledgerId,
  ledgerClosing: ledgerCloseScenarios.preSuccess.state,
});

const decideClosing = states.decideClosing({
  processId,
  channelId,
  ledgerId,
});

const waitForDefund = states.waitForDefund({
  processId,
  channelId,
  ledgerId,
  defunding: prependToLocator(defundingScenarios.preSuccess.state, EmbeddedProtocol.Defunding),
});

const waitForConcluding = states.waitForConclude({
  processId,
  channelId,
  ledgerId,
  concluding: prependToLocator(
    advanceChannelScenarios.conclude.preSuccess.state,
    EmbeddedProtocol.AdvanceChannel,
  ),
});

const keepOpenSelectedAction = actions.keepOpenSelected({ processId });
const closeSelectedAction = actions.closeSelected({ processId });

const initialSharedData = setFundingState(
  setFundingState(
    testScenarios.setChannels(EMPTY_SHARED_DATA, [
      testScenarios.channelStateFromStates([app50, app51]),
      testScenarios.channelStateFromStates([ledger5, ledger6]),
    ]),
    channelId,
    { directlyFunded: false, fundingChannel: testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID },
  ),
  testScenarios.TWO_PARTICIPANT_LEDGER_CHANNEL_ID,
  { directlyFunded: true },
);

export const opponentConcludedHappyPath = {
  initialize: {
    channelId,
    processId,
    opponentInstigatedConclude: true,
    sharedData: initialSharedData,
  },
  waitForConclude: {
    state: waitForConcluding,
    action: prependToLocator(
      advanceChannelScenarios.conclude.preSuccess.trigger,
      EmbeddedProtocol.AdvanceChannel,
    ),

    sharedData: mergeSharedData(
      initialSharedData,
      advanceChannelScenarios.conclude.preSuccess.sharedData,
    ),
  },
  waitForDefund: {
    state: waitForDefund,
    action: prependToLocator(defundingScenarios.preSuccess.action, EmbeddedProtocol.Defunding),
    sharedData: defundingScenarios.preSuccess.sharedData,
  },
  decideClosing: {
    state: decideClosing,
    action: keepOpenSelectedAction,
    sharedData: initialSharedData,
  },
};

export const playerConcludedHappyPath = {
  initialize: {
    channelId,
    processId,
    opponentInstigatedConclude: false,
    sharedData: initialSharedData,
  },
  waitForConclude: {
    state: waitForConcluding,
    action: prependToLocator(
      advanceChannelScenarios.conclude.preSuccess.trigger,
      EmbeddedProtocol.AdvanceChannel,
    ),
    sharedData: mergeSharedData(
      initialSharedData,
      advanceChannelScenarios.conclude.preSuccess.sharedData,
    ),
  },
  waitForDefund: {
    state: waitForDefund,
    action: prependToLocator(defundingScenarios.preSuccess.action, EmbeddedProtocol.Defunding),
    sharedData: defundingScenarios.preSuccess.sharedData,
  },
  decideClosing: {
    state: decideClosing,
    action: keepOpenSelectedAction,
    sharedData: initialSharedData,
  },
};

export const channelClosingHappyPath = {
  initialize: {
    channelId,
    processId,
    opponentInstigatedConclude: false,
    sharedData: initialSharedData,
  },
  waitForConclude: {
    state: waitForConcluding,
    action: prependToLocator(
      advanceChannelScenarios.conclude.preSuccess.trigger,
      EmbeddedProtocol.AdvanceChannel,
    ),
    sharedData: mergeSharedData(
      initialSharedData,
      advanceChannelScenarios.conclude.preSuccess.sharedData,
    ),
  },
  waitForDefund: {
    state: waitForDefund,
    action: prependToLocator(defundingScenarios.preSuccess.action, EmbeddedProtocol.Defunding),
    sharedData: defundingScenarios.preSuccess.sharedData,
  },
  decideClosing: {
    state: decideClosing,
    action: closeSelectedAction,
    sharedData: mergeSharedData(ledgerCloseScenarios.preSuccess.sharedData, initialSharedData),
  },
  waitForLedgerClosing: {
    state: waitForLedgerClosing,
    action: ledgerCloseScenarios.preSuccess.action,
    sharedData: mergeSharedData(ledgerCloseScenarios.preSuccess.sharedData, initialSharedData),
  },
};
