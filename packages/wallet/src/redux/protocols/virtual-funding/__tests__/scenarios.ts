import * as states from '../states';

import * as scenarios from '../../../../domain/commitments/__tests__';

import { preFund, postFund } from '../../advance-channel/__tests__';
import { preSuccess as ledgerFundingPreSuccess } from '../../ledger-funding/__tests__';
import {
  threePlayerPreSuccessA as consensusUpdatePreSuccess,
  threePlayerInProgressA as consensusUpdateInProgress,
} from '../../consensus-update/__tests__';
import { appState, twoThree } from '../../../../domain/commitments/__tests__';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import { prependToLocator } from '../..';
import { EmbeddedProtocol } from '../../../../communication';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../../advance-channel/reducer';
import _ from 'lodash';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { StateType } from '../../advance-channel/states';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const { asAddress, threeParticipants: destination } = scenarios;

const app0 = appState({ turnNum: 0, outcome: twoThree });
const app1 = appState({ turnNum: 1, outcome: twoThree });
const appChannel = scenarios.channelStateFromStates([app0, app1]);
const targetChannelId = getChannelId(appChannel.channel);
const hubAddress = destination[2];
const jointChannelId = ledgerFundingPreSuccess.state.existingLedgerFundingState.ledgerId;

const startingOutcome = app0.state.outcome;

const initializeArgs: states.InitializationArgs = {
  startingOutcome,
  processId,
  targetChannelId,
  // To properly test the embedded advanceChannel protocols, it's useful to be playerA
  // to make sure that the commitments get sent.
  ourAddress: asAddress,
  hubAddress,
  protocolLocator: ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
};

const props = {
  targetChannelId,
  processId,
  jointChannelId,
  startingOutcome,
  hubAddress,
  ourIndex: PlayerIndex.A,
  protocolLocator: [],
  ourAddress: asAddress,
};

// ----
// States
// ------

const scenarioStates = {
  waitForJointChannel1: states.waitForJointChannel({
    ...props,
    jointChannel: preFund.preSuccess.state,
  }),
  waitForJointChannel2: states.waitForJointChannel({
    ...props,
    jointChannel: {
      ...preFund.preSuccess.state,
      stateType: StateType.PostFunding,
    },
  }),

  waitForGuarantorChannel1: states.waitForGuarantorChannel({
    ...props,
    guarantorChannel: preFund.preSuccess.state,
    jointChannelId,
  }),
  waitForGuarantorChannel2: states.waitForGuarantorChannel({
    ...props,
    guarantorChannel: postFund.preSuccess.state,
    jointChannelId,
  }),
  waitForGuarantorFunding: states.waitForGuarantorFunding({
    ...props,
    indirectGuarantorFunding: ledgerFundingPreSuccess.state,
    indirectApplicationFunding: consensusUpdatePreSuccess.state,
    jointChannelId,
  }),
  waitForApplicationFunding: states.waitForApplicationFunding({
    ...props,
    indirectApplicationFunding: consensusUpdatePreSuccess.state,
  }),
};

// -------
// Shared Data
// -------

// -------
// Actions
// -------

// ---------
// Scenarios
// ---------

export const appFundingCommitmentReceivedEarly = {
  appFundingCommitmentReceivedEarly: {
    appChannelId: getChannelId(appChannel.channel),
    state: scenarioStates.waitForGuarantorFunding,
    action: consensusUpdateInProgress.action,
    sharedData: consensusUpdateInProgress.sharedData,
  },
  fundingSuccess: {
    state: scenarioStates.waitForGuarantorFunding,
    action: prependToLocator(ledgerFundingPreSuccess.action, EmbeddedProtocol.LedgerFunding),
    sharedData: _.merge(consensusUpdatePreSuccess.sharedData, ledgerFundingPreSuccess.sharedData),
  },
};

export const happyPath = {
  ...props,
  initialize: {
    args: initializeArgs,
    sharedData: scenarios.setChannels(scenarios.testEmptySharedData(), [appChannel]),
  },
  openJ: {
    state: scenarioStates.waitForJointChannel1,
    action: preFund.preSuccess.trigger,
    sharedData: scenarios.setChannels(preFund.preSuccess.sharedData, [appChannel]),
  },
  prepareJ: {
    state: scenarioStates.waitForJointChannel2,
    action: postFund.preSuccess.trigger,
    sharedData: scenarios.setChannels(postFund.preSuccess.sharedData, [appChannel]),
    jointChannelId,
  },
  openG: {
    state: scenarioStates.waitForGuarantorChannel1,
    action: preFund.preSuccess.trigger,
    sharedData: scenarios.setChannels(preFund.preSuccess.sharedData, [appChannel]),
  },
  prepareG: {
    state: scenarioStates.waitForGuarantorChannel2,
    action: postFund.preSuccess.trigger,
    sharedData: _.merge(
      ledgerFundingPreSuccess.sharedData,
      scenarios.setChannels(postFund.preSuccess.sharedData, [appChannel]),
    ),
  },
  fundG: {
    appChannelId: getChannelId(appChannel.channel),
    state: scenarioStates.waitForGuarantorFunding,
    action: prependToLocator(ledgerFundingPreSuccess.action, EmbeddedProtocol.LedgerFunding),
    sharedData: ledgerFundingPreSuccess.sharedData,
  },
  fundApp: {
    state: scenarioStates.waitForApplicationFunding,
    action: consensusUpdatePreSuccess.action,
    sharedData: consensusUpdatePreSuccess.sharedData,
  },
};
