import * as testScenarios from '../../../../domain/commitments/__tests__';
import * as defundingScenarios from '../../defunding/__tests__';
import * as advanceChannelScenarios from '../../advance-channel/__tests__';

import * as states from '../states';
import { EMPTY_SHARED_DATA, setChannels } from '../../../state';
import { bigNumberify } from 'ethers/utils';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { mergeSharedData } from '../../../__tests__/helpers';
import { prependToLocator } from '../../../protocols';
import { EmbeddedProtocol } from '../../../../communication';
import * as actions from '../actions';
import * as ledgerCloseScenarios from '../../close-ledger-channel/__tests__';

const processId = 'processId';
const { channelId, asAddress, bsAddress, asPrivateKey, appCommitment } = testScenarios;
const twoThree = [
  { address: asAddress, wei: bigNumberify(2).toHexString() },
  { address: bsAddress, wei: bigNumberify(3).toHexString() },
];

const app50 = appCommitment({ turnNum: 50, balances: twoThree, isFinal: false });
const app51 = appCommitment({ turnNum: 51, balances: twoThree, isFinal: false });

const waitForLedgerClosing = states.waitForLedgerClose({
  processId,
  channelId,
  ledgerClosing: ledgerCloseScenarios.preSuccess.state,
});

const decideClosing = states.decideClosing({
  processId,
  channelId,
});

const waitForDefund = states.waitForDefund({
  processId,
  channelId,
  defunding: prependToLocator(defundingScenarios.preSuccess.state, EmbeddedProtocol.Defunding),
});

const waitForConcluding = states.waitForConclude({
  processId,
  channelId,
  concluding: prependToLocator(
    advanceChannelScenarios.conclude.preSuccess.state,
    EmbeddedProtocol.AdvanceChannel,
  ),
});

const keepOpenSelectedAction = actions.keepOpenSelected({ processId });
const closeSelectedAction = actions.closeSelected({ processId });

const initialSharedData = setChannels(EMPTY_SHARED_DATA, [
  channelFromCommitments([app50, app51], asAddress, asPrivateKey),
]);

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
    sharedData: EMPTY_SHARED_DATA,
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
    sharedData: EMPTY_SHARED_DATA,
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
    sharedData: ledgerCloseScenarios.preSuccess.sharedData,
  },
  waitForLedgerClosing: {
    state: waitForLedgerClosing,
    action: ledgerCloseScenarios.preSuccess.action,
    sharedData: ledgerCloseScenarios.preSuccess.sharedData,
  },
};
