import * as states from '../states';

import { EMPTY_SHARED_DATA, setChannel } from '../../../state';
import * as scenarios from '../../../../domain/commitments/__tests__';
import { CommitmentType } from '../../../../domain';
import { preFund, postFund } from '../../advance-channel/__tests__';
import { preSuccess as indirectFundingPreSuccess } from '../../indirect-funding/__tests__';
import { threePlayerPreSuccessA as consensusUpdatePreSuccess } from '../../consensus-update/__tests__';
import { channelFromCommitments } from '../../../channel-store/channel-state/__tests__';
import { appCommitment, twoThree } from '../../../../domain/commitments/__tests__';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../../constants';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../../existing-ledger-funding/reducer';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../../consensus-update/reducer';

// ---------
// Test data
// ---------
const processId = 'Process.123';
const { asAddress, asPrivateKey, threeParticipants: destination } = scenarios;
const channelType = CONSENSUS_LIBRARY_ADDRESS;
const signedCommitment0 = scenarios.threeWayLedgerCommitment({ turnNum: 0 });
const appAttributes = signedCommitment0.commitment.appAttributes;

const app0 = appCommitment({ turnNum: 0, balances: twoThree });
const app1 = appCommitment({ turnNum: 1, balances: twoThree });
const appChannel = channelFromCommitments([app0, app1], asAddress, asPrivateKey);
const targetChannelId = appChannel.channelId;
const hubAddress = destination[2];
const jointChannelId = indirectFundingPreSuccess.state.existingLedgerFundingState.ledgerId;

const startingAllocation = app0.commitment.allocation;
const startingDestination = app0.commitment.destination;

const initializeArgs = {
  startingAllocation,
  startingDestination,
  participants: destination,
  channelType,
  appAttributes,
  processId,
  clearedToSend: true,
  // To properly test the embedded advanceChannel protocols, it's useful to be playerA
  // to make sure that the commitments get sent.
  address: asAddress,
  privateKey: asPrivateKey,
  ourIndex: 0,
  commitmentType: CommitmentType.PreFundSetup,
  targetChannelId,
  hubAddress,
};

const props = {
  targetChannelId,
  processId,
  startingAllocation,
  startingDestination,
  hubAddress,
  ourIndex: PlayerIndex.A,
  jointChannelId,
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
      commitmentType: CommitmentType.PostFundSetup,
    },
  }),

  waitForGuarantorChannel1: states.waitForGuarantorChannel({
    ...props,
    guarantorChannel: preFund.preSuccess.state,
  }),
  waitForGuarantorChannel2: states.waitForGuarantorChannel({
    ...props,
    guarantorChannel: postFund.preSuccess.state,
  }),
  waitForGuarantorFunding: states.waitForGuarantorFunding({
    ...props,
    indirectGuarantorFunding: indirectFundingPreSuccess.state,
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

export const happyPath = {
  ...props,
  initialize: {
    args: initializeArgs,
    sharedData: setChannel(EMPTY_SHARED_DATA, appChannel),
  },
  openJ: {
    state: scenarioStates.waitForJointChannel1,
    action: { ...preFund.preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(preFund.preSuccess.sharedData, appChannel),
  },
  prepareJ: {
    state: scenarioStates.waitForJointChannel2,
    action: { ...postFund.preSuccess.trigger, protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(postFund.preSuccess.sharedData, appChannel),
    jointChannelId,
  },
  openG: {
    state: scenarioStates.waitForGuarantorChannel1,
    action: { ...preFund.preSuccess.trigger, protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR },
    sharedData: setChannel(preFund.preSuccess.sharedData, appChannel),
  },
  prepareG: {
    state: scenarioStates.waitForGuarantorChannel2,
    action: {
      ...postFund.preSuccess.trigger,
      protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
    },
    sharedData: setChannel(postFund.preSuccess.sharedData, appChannel),
  },
  fundG: {
    appChannelId: appChannel.channelId,
    state: scenarioStates.waitForGuarantorFunding,
    action: {
      ...indirectFundingPreSuccess.action,
      protocolLocator: `${
        states.INDIRECT_GUARANTOR_FUNDING_DESCRIPTOR
      }/${EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR}`,
    },
    sharedData: indirectFundingPreSuccess.sharedData,
  },
  fundApp: {
    state: scenarioStates.waitForApplicationFunding,
    action: {
      ...consensusUpdatePreSuccess.action,
      protocolLocator: `${
        states.INDIRECT_APPLICATION_FUNDING_DESCRIPTOR
      }/${CONSENSUS_UPDATE_PROTOCOL_LOCATOR}`,
    },
    sharedData: consensusUpdatePreSuccess.sharedData,
  },
};
